import { Injectable, Logger } from '@nestjs/common';
import ManageIndicateurValeursService from '@tet/backend/indicateurs/valeurs/manage-indicateur-valeurs/manage-indicateur-valeurs.service';
import { IndicateurValeursError } from '@tet/backend/indicateurs/valeurs/indicateur-valeurs.errors';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { IndicateurValeurCreate } from '@tet/domain/indicateurs';
import { getErrorMessage } from '@tet/domain/utils';
import { chunk } from 'es-toolkit';
import { buildSnbc3Valeurs, Snbc3Territoire } from './build-snbc3-valeurs';
import { ImportTrajectoireSnbc3Error } from './import-trajectoire-snbc3.errors';
import {
  ImportTrajectoireSnbc3Input,
  ImportTrajectoireSnbc3Report,
} from './import-trajectoire-snbc3.input';
import { readSnbc3Parquet, Snbc3ParquetTable } from './read-snbc3-parquet';
import { Snbc3ArtifactReader } from './snbc3-artifact.reader';
import { getSnbc3CollectiviteKey } from './snbc3-collectivite-key';
import { SNBC3_IMPORTED_IDENTIFIANTS } from './snbc3-mapping';
import {
  Snbc3ReleaseFiles,
  Snbc3ReleaseStorageService,
} from './snbc3-release-storage.service';
import { Snbc3SourceMetadonneeRepository } from './snbc3-source-metadonnee.repository';

type MatchedTerritoire = { territoireIndex: number; collectiviteId: number };

/**
 * Territoires écrits par transaction : le coût fixe de l'écriture (requêtes et
 * cascade de calcul des totaux) est payé une fois par lot.
 */
const SNBC3_BATCH_SIZE = 10;
/** Un journal d'avancement tous les 200 territoires. */
const SNBC3_PROGRESS_LOG_BATCHES = 20;

/**
 * Importe une release du dépôt `snbc3` comme source `snbc3` (ADR 0023, §2).
 *
 * Lancé à la main, par le service role, à chaque nouvelle livraison, et
 * exécuté par `ImportTrajectoireSnbc3Worker`. Une seule métadonnée `snbc3`
 * existe : chaque import complet la met à jour et remplace les valeurs du
 * précédent, en place. Les totaux sont laissés aux formules.
 */
@Injectable()
export class ImportTrajectoireSnbc3Service {
  private readonly logger = new Logger(ImportTrajectoireSnbc3Service.name);

  constructor(
    private readonly reader: Snbc3ArtifactReader,
    private readonly repository: Snbc3SourceMetadonneeRepository,
    private readonly valeursService: ManageIndicateurValeursService,
    private readonly storage: Snbc3ReleaseStorageService
  ) {}

  /**
   * Lit et vérifie la release, puis remplace les valeurs territoire par
   * territoire. Une fois les valeurs remplacées, un import complet met à jour
   * la date de la métadonnée et enregistre la release dans le bucket : tant
   * que l'import n'est pas allé au bout, l'un et l'autre désignent encore la
   * release précédente. Un rejeu partiel n'y touche pas, et n'est accepté que
   * pour la release du dernier import complet, tant qu'aucun import complet
   * commencé depuis n'a échoué (`pending-release.json`, écrit avant de
   * toucher aux valeurs) : il faut alors relancer un import complet.
   *
   * Le statut et le rapport sont écrits dans `last-import.json`.
   */
  async importRelease(
    input: ImportTrajectoireSnbc3Input
  ): Promise<
    Result<ImportTrajectoireSnbc3Report, ImportTrajectoireSnbc3Error>
  > {
    const { commit, version, collectiviteIds } = input;
    const startedAt = Date.now();
    const tracking = {
      startedAt: new Date(startedAt).toISOString(),
      commit,
      version,
      collectiviteIds,
    };
    this.logger.log(`Import SNBC 3 : release ${version} du commit ${commit}`);
    await this.storage.writeLastImport({ ...tracking, status: 'running' });

    const prepared = await this.prepareImport(input);
    if (!prepared.success) {
      await this.storage.writeLastImport({
        ...tracking,
        status: 'failed',
        error: prepared.error,
      });
      return prepared;
    }
    const { table, metadonneeId, report, releaseFiles } = prepared.data;

    let importId: string | undefined;
    if (releaseFiles) {
      // Avant toute écriture : jusqu'à l'enregistrement de cette release, les
      // valeurs peuvent mélanger deux releases, et les rejeux partiels sont
      // refusés.
      const marked = await this.storage.markReleasePending(releaseFiles);
      if (!marked.success) {
        await this.storage.writeLastImport({
          ...tracking,
          status: 'failed',
          error: marked.error,
        });
        return marked;
      }
      importId = marked.data;
    }

    await this.storage.writeLastImport({
      ...tracking,
      status: 'running',
      report,
    });
    try {
      await this.replaceValeurs(
        { table, collectiviteIds, metadonneeId, startedAt },
        report
      );
      if (releaseFiles && importId) {
        await this.repository.updateMetadonnee(metadonneeId, {
          dateVersion: report.dateVersion,
        });
        // En dernier : le manifeste désigne alors la release en base.
        const stored = await this.storage.storeReleaseFiles(
          releaseFiles,
          importId
        );
        if (!stored.success) {
          this.logger.error(
            `Import SNBC 3 : valeurs remplacées, mais release non enregistrée (${stored.error})`
          );
          await this.storage.writeLastImport({
            ...tracking,
            status: 'failed',
            error: stored.error,
            report,
          });
          return stored;
        }
      }
    } catch (error) {
      this.logger.error(`Import SNBC 3 interrompu : ${getErrorMessage(error)}`);
      await this.storage.writeLastImport({
        ...tracking,
        status: 'failed',
        error: getErrorMessage(error),
        report,
      });
      return failure(
        'SERVER_ERROR',
        error instanceof Error ? error : new Error(String(error))
      );
    }
    await this.storage.writeLastImport({
      ...tracking,
      status: report.errors.length ? 'done_with_errors' : 'done',
      report,
    });
    return success(report);
  }

  /** Échec survenu hors de `importRelease` (process mort pendant l'import). */
  async recordFailure(
    { commit, version, collectiviteIds }: ImportTrajectoireSnbc3Input,
    error: string
  ) {
    await this.storage.writeLastImport({
      status: 'failed',
      startedAt: new Date().toISOString(),
      commit,
      version,
      collectiviteIds,
      error,
    });
  }

  /**
   * Lit et vérifie la release. Pour un import complet, la métadonnée est créée
   * si elle n'existe pas, sans changer la date d'une métadonnée existante, et
   * les fichiers à enregistrer après le remplacement des valeurs sont gardés
   * (`releaseFiles` : manifeste et classeur, plutôt qu'une seconde lecture de
   * la release, qui retéléchargerait le parquet). Le parquet n'est gardé que décodé en colonnes : le
   * parquet brut ne reste pas en mémoire pendant le remplacement des valeurs.
   */
  private async prepareImport({
    commit,
    version,
    collectiviteIds,
  }: ImportTrajectoireSnbc3Input): Promise<
    Result<
      {
        table: Snbc3ParquetTable;
        metadonneeId: number;
        report: ImportTrajectoireSnbc3Report;
        /** `null` pour un rejeu partiel. */
        releaseFiles: Snbc3ReleaseFiles | null;
      },
      ImportTrajectoireSnbc3Error
    >
  > {
    const release = await this.reader.readRelease(commit, version);
    if (!release.success) return release;
    const { sha, date } = release.data;

    const isPartial = collectiviteIds !== undefined;
    if (isPartial) {
      const imported = await this.storage.getReplayableRelease();
      if (imported?.commit !== sha || imported.version !== version) {
        this.logger.error(
          `Rejeu partiel refusé : la release ${version}@${sha} n'est pas la dernière importée (${
            imported ? `${imported.version}@${imported.commit}` : 'aucune'
          })`
        );
        return failure('SNBC3_PARTIAL_IMPORT_RELEASE_MISMATCH');
      }
    }

    const parsed = await readSnbc3Parquet(release.data.parquet);
    if (!parsed.success) {
      this.logger.error(`Parquet hors contrat : ${parsed.error.message}`);
      return failure(parsed.error.error);
    }

    let metadonneeId: number | null;
    let releaseFiles: Snbc3ReleaseFiles | null = null;
    if (isPartial) {
      metadonneeId = await this.repository.findMetadonneeId();
      if (metadonneeId === null) {
        return failure('SNBC3_PARTIAL_IMPORT_RELEASE_MISMATCH');
      }
    } else {
      // Le premier import a besoin d'un id pour écrire les valeurs.
      metadonneeId = await this.repository.findOrCreateMetadonnee({
        dateVersion: date,
      });
      const { manifest, workbook, methodologie } = release.data;
      releaseFiles = { sha, version, manifest, workbook, methodologie };
    }

    return success({
      table: parsed.data,
      metadonneeId,
      releaseFiles,
      report: {
        commit: sha,
        version,
        dateVersion: date,
        metadonneeId,
        territoireCount: parsed.data.territoires.length,
        unmatchedTerritoires: [],
        epciIdsWithoutTrajectoire: [],
        clearedCollectiviteIds: [],
        valeurs: { created: 0, updated: 0, unchanged: 0, deleted: 0 },
        errors: [],
        durationMs: 0,
      },
    });
  }

  private async replaceValeurs(
    {
      table,
      collectiviteIds,
      metadonneeId,
      startedAt,
    }: {
      table: Snbc3ParquetTable;
      collectiviteIds?: number[];
      metadonneeId: number;
      startedAt: number;
    },
    report: ImportTrajectoireSnbc3Report
  ) {
    const matched = await this.matchCollectivites(table, report);
    const indicateurIds = await this.repository.getIndicateurIds(
      SNBC3_IMPORTED_IDENTIFIANTS
    );
    const filter = collectiviteIds ? new Set(collectiviteIds) : null;

    const selected = matched.filter(
      ({ collectiviteId }) => !filter || filter.has(collectiviteId)
    );
    const batches = chunk(selected, SNBC3_BATCH_SIZE);
    for (const [batchIndex, batch] of batches.entries()) {
      // Les lignes ne sont matérialisées que le temps du lot.
      const built = batch.flatMap(({ territoireIndex, collectiviteId }) => {
        const territoire = table.getTerritoire(territoireIndex);
        const valeurs = this.buildTerritoireValeurs(
          { territoire, collectiviteId, metadonneeId, indicateurIds },
          report
        );
        return valeurs
          ? [{ territoire: territoire.code, collectiviteId, valeurs }]
          : [];
      });
      await this.writeBatch(built, metadonneeId, report);
      if ((batchIndex + 1) % SNBC3_PROGRESS_LOG_BATCHES === 0) {
        this.logProgress(batchIndex + 1, batches.length);
      }
    }

    if (!filter) {
      // Un territoire en erreur garderait les valeurs de la release
      // précédente sous celle qui va être enregistrée : il est vidé comme un
      // absent, puis rejoué avec `collectiviteIds`.
      const failed = new Set(
        report.errors.map(({ collectiviteId }) => collectiviteId)
      );
      await this.clearMissingCollectivites(
        metadonneeId,
        new Set(
          matched
            .map(({ collectiviteId }) => collectiviteId)
            .filter((id) => !failed.has(id))
        ),
        report
      );
    }

    report.durationMs = Date.now() - startedAt;
    this.logger.log(
      `Import SNBC 3 terminé en ${Math.round(report.durationMs / 1000)} s : ${
        report.valeurs.created
      } valeurs créées, ${report.valeurs.updated} modifiées, ${
        report.valeurs.unchanged
      } inchangées, ${report.valeurs.deleted} supprimées, ${
        report.errors.length
      } territoires en erreur`
    );
    this.logger.log(`Rapport de l'import SNBC 3 : ${JSON.stringify(report)}`);
  }

  /**
   * Avancement d'un import en arrière-plan, avec la mémoire vivante (tas V8) :
   * contrairement au RSS, elle ne compte pas la réserve que V8 garde après un
   * passage du ramasse-miettes.
   */
  private logProgress(doneBatches: number, totalBatches: number) {
    const { heapUsed, rss } = process.memoryUsage();
    this.logger.log(
      `Import SNBC 3 : ${doneBatches}/${totalBatches} lots, tas ${Math.round(
        heapUsed / 1e6
      )} Mo, RSS ${Math.round(rss / 1e6)} Mo`
    );
  }

  /** Rattache chaque territoire à sa collectivité TeT ; note les autres. */
  private async matchCollectivites(
    table: Snbc3ParquetTable,
    report: ImportTrajectoireSnbc3Report
  ): Promise<MatchedTerritoire[]> {
    const keys = table.territoires.map(getSnbc3CollectiviteKey);
    const collectivites = await this.repository.listCollectivites({
      sirens: keys.flatMap(({ siren }) => (siren ? [siren] : [])),
      communeCodes: keys.flatMap(({ communeCode }) =>
        communeCode ? [communeCode] : []
      ),
    });
    const bySiren = new Map(
      collectivites.flatMap((c) => (c.siren ? [[c.siren, c.id] as const] : []))
    );
    const byCommuneCode = new Map(
      collectivites.flatMap((c) =>
        c.communeCode ? [[c.communeCode, c.id] as const] : []
      )
    );

    const matched: MatchedTerritoire[] = [];
    table.territoires.forEach((territoire, territoireIndex) => {
      const { siren, communeCode } = keys[territoireIndex];
      const collectiviteId = siren
        ? bySiren.get(siren)
        : byCommuneCode.get(communeCode as string);
      if (collectiviteId === undefined) {
        report.unmatchedTerritoires.push(territoire.code);
      } else {
        matched.push({ territoireIndex, collectiviteId });
      }
    });

    const withTrajectoire = new Set(matched.map((m) => m.collectiviteId));
    report.epciIdsWithoutTrajectoire = (
      await this.repository.listEpciIds()
    ).filter((id) => !withTrajectoire.has(id));
    if (report.unmatchedTerritoires.length) {
      this.logger.warn(
        `Territoires sans collectivité TeT : ${report.unmatchedTerritoires.join(
          ', '
        )}`
      );
    }
    return matched;
  }

  /** Valeurs d'un territoire, ou `null` après avoir consigné son erreur. */
  private buildTerritoireValeurs(
    {
      territoire,
      collectiviteId,
      metadonneeId,
      indicateurIds,
    }: {
      territoire: Snbc3Territoire;
      collectiviteId: number;
      metadonneeId: number;
      indicateurIds: Map<string, number>;
    },
    report: ImportTrajectoireSnbc3Report
  ): IndicateurValeurCreate[] | null {
    const built = buildSnbc3Valeurs(territoire);
    if (!built.success) {
      this.reportError(
        { territoire: territoire.code, collectiviteId },
        `codes SNBC 3 inconnus : ${built.error.codes.join(', ')}`,
        report
      );
      return null;
    }

    const valeurs: IndicateurValeurCreate[] = [];
    for (const valeur of built.data) {
      const indicateurId = indicateurIds.get(valeur.identifiant);
      if (indicateurId === undefined) {
        this.reportError(
          { territoire: territoire.code, collectiviteId },
          `indicateur ${valeur.identifiant} absent du catalogue (importer le catalogue avant la SNBC 3)`,
          report
        );
        return null;
      }
      valeurs.push({
        collectiviteId,
        indicateurId,
        metadonneeId,
        dateValeur: `${valeur.annee}-01-01`,
        objectif: valeur.objectif,
        objectifCommentaire: valeur.objectifCommentaire,
      });
    }
    return valeurs;
  }

  /**
   * Écrit un lot de territoires dans une seule transaction. Si le lot échoue
   * sur ses données, il est rejoué territoire par territoire, pour que l'échec
   * de l'un n'empêche pas les autres et soit attribué au bon territoire. Une
   * panne de la base est levée : elle arrête l'import, marqué `failed`.
   */
  private async writeBatch(
    batch: {
      territoire: string;
      collectiviteId: number;
      valeurs: IndicateurValeurCreate[];
    }[],
    metadonneeId: number,
    report: ImportTrajectoireSnbc3Report
  ) {
    if (!batch.length) return;
    const counts = await this.valeursService.replaceMetadonneeValeurs({
      collectiviteIds: batch.map(({ collectiviteId }) => collectiviteId),
      metadonneeId,
      valeurs: batch.flatMap(({ valeurs }) => valeurs),
    });
    if (counts.success) {
      report.valeurs.created += counts.data.created;
      report.valeurs.updated += counts.data.updated;
      report.valeurs.unchanged += counts.data.unchanged;
      report.valeurs.deleted += counts.data.deleted;
      return;
    }
    if (isInfrastructureError(counts.error, counts.cause)) {
      throw counts.cause ?? new Error(counts.error);
    }
    if (batch.length === 1) {
      this.reportError(
        batch[0],
        getErrorMessage(counts.cause ?? counts.error),
        report
      );
      return;
    }
    for (const item of batch) {
      await this.writeBatch([item], metadonneeId, report);
    }
  }

  /** L'échec d'un territoire est consigné, sans arrêter les autres. */
  private reportError(
    {
      territoire,
      collectiviteId,
    }: { territoire: string; collectiviteId: number },
    message: string,
    report: ImportTrajectoireSnbc3Report
  ) {
    this.logger.error(
      `Territoire ${territoire} (collectivité ${collectiviteId}) : ${message}`
    );
    report.errors.push({ territoire, collectiviteId, message });
  }

  /**
   * Un territoire absent du nouveau millésime, ou en erreur, perd sa
   * trajectoire `snbc3`, totaux calculés compris. Comme pour `replaceMetadonneeValeurs`, le rapport
   * ne compte que les valeurs importées supprimées.
   */
  private async clearMissingCollectivites(
    metadonneeId: number,
    importedCollectiviteIds: Set<number>,
    report: ImportTrajectoireSnbc3Report
  ) {
    const missing = (
      await this.repository.listCollectivitesWithValeurs(metadonneeId)
    ).filter(
      ({ collectiviteId }) => !importedCollectiviteIds.has(collectiviteId)
    );
    for (const { collectiviteId, importedCount } of missing) {
      await this.valeursService.deleteIndicateurValeurs({
        collectiviteId,
        metadonneeId,
      });
      report.valeurs.deleted += importedCount;
      report.clearedCollectiviteIds.push(collectiviteId);
    }
  }
}

/** Classes SQLSTATE des erreurs portées par les données d'une ligne. */
const DATA_SQLSTATE_CLASSES = [
  '22', // data_exception
  '23', // integrity_constraint_violation
];

/**
 * Panne de la base (connexion, verrou, ressources…), à distinguer d'une
 * valeur refusée : `DATABASE_ERROR` regroupe toutes les exceptions levées
 * pendant l'écriture, on en écarte celles dont le SQLSTATE vise les données.
 */
function isInfrastructureError(
  error: IndicateurValeursError,
  cause: unknown
): boolean {
  if (error !== 'DATABASE_ERROR') return false;
  const sqlState = findSqlState(cause);
  return (
    sqlState === null || !DATA_SQLSTATE_CLASSES.includes(sqlState.slice(0, 2))
  );
}

/** SQLSTATE d'une erreur PostgreSQL, éventuellement enveloppée (`cause`). */
function findSqlState(error: unknown): string | null {
  for (
    let current = error, depth = 0;
    current instanceof Object && depth < 5;
    current = (current as { cause?: unknown }).cause, depth++
  ) {
    const { code } = current as { code?: unknown };
    if (typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code)) return code;
  }
  return null;
}
