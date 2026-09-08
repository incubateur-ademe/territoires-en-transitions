import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  EpciPerimetre,
  epciPerimetreSchema,
} from '@tet/backend/collectivites/import-collectivite-relations/epci-perimetre.schema';
import {
  EPCI_PERIMETRE_DATAGOUV_URL,
  epciPerimetreCsvPath,
} from '@tet/backend/collectivites/import-collectivite-relations/epci-perimetre.source';
import { ImportPerimetresEpciResponse } from '@tet/backend/collectivites/import-perimetres-epci/import-perimetres-epci.response';
import {
  EpciCommuneInsert,
  epciCommuneTable,
} from '@tet/backend/collectivites/shared/models/imports-epci-commune.table';
import { CsvService } from '@tet/backend/utils/csv/csv.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { getErrorMessage } from '@tet/domain/utils';
import { sql } from 'drizzle-orm';
import { chunk } from 'es-toolkit';
import { readFileSync } from 'fs';

/**
 * Recalcule les départements et régions qu'un EPCI couvre au-delà de son siège,
 * depuis la composition communale BANATIC.
 *
 * Le calcul lui-même n'est pas ici : il est en SQL
 * (`imports.update_epci_perimetres_from_banatic()`), parce que le seed en a
 * besoin autant que ce service. Ce service ne fait que trois choses — aller
 * chercher la source, remplacer `imports.epci_commune`, appeler la fonction —
 * pour que la règle n'existe qu'à un seul endroit.
 *
 * Rejoué une fois par an par le scheduler de `apps/tools` : les périmètres des
 * EPCI à fiscalité propre bougent peu, et la source est publiée à ce rythme.
 */
@Injectable()
export class ImportPerimetresEpciService {
  private readonly logger = new Logger(ImportPerimetresEpciService.name);

  /** Les lignes partent par paquets : la source en compte près de 35 000. */
  private readonly TAILLE_LOT = 1000;

  /**
   * Une source amputée ne doit pas vider les périmètres. Ce n'est pas une
   * précaution abstraite : rien ne filtre par `source` à la lecture, donc chaque
   * ligne perdue retire un accès au dépôt PCAET d'un EPCI à la DDT ou à la DREAL
   * du territoire concerné. Mieux vaut refuser l'import et garder l'état
   * précédent.
   */
  private readonly MIN_LIGNES = 30_000;
  private readonly MIN_EPCI = 1_200;

  constructor(
    private readonly database: DatabaseService,
    private readonly csvService: CsvService
  ) {}

  async importPerimetresEpci(
    depuisDatagouv = true
  ): Promise<ImportPerimetresEpciResponse> {
    const { contenu, origine } = depuisDatagouv
      ? await this.telecharger()
      : { contenu: this.lireFichierCommitte(), origine: 'fichier-committe' as const };

    const lignes = await this.lire(contenu);

    const perimetres = await this.remplacerEtRecalculer(lignes);

    const epci = new Set(lignes.map(({ sirenEpci }) => sirenEpci)).size;
    this.logger.log(
      `${lignes.length} communes membres, ${epci} EPCI, ${perimetres} périmètres secondaires (source : ${origine})`
    );

    return { communes: lignes.length, epci, perimetres, origine };
  }

  private async telecharger(): Promise<{
    contenu: string;
    origine: 'datagouv' | 'fichier-committe';
  }> {
    try {
      const reponse = await fetch(EPCI_PERIMETRE_DATAGOUV_URL);
      if (!reponse.ok) {
        throw new UnprocessableEntityException(
          `${reponse.status} ${reponse.statusText}`
        );
      }
      return { contenu: await reponse.text(), origine: 'datagouv' };
    } catch (error: unknown) {
      // Le réseau n'est pas une raison de laisser les périmètres tomber : le
      // millésime committé vaut mieux que rien, et l'écart avec la source se
      // rattrape au rejeu suivant.
      this.logger.warn(
        `source data.gouv injoignable (${getErrorMessage(
          error
        )}) — repli sur le fichier committé`
      );
      return { contenu: this.lireFichierCommitte(), origine: 'fichier-committe' };
    }
  }

  private lireFichierCommitte(): string {
    const chemin = epciPerimetreCsvPath();
    try {
      return readFileSync(chemin, 'utf-8');
    } catch (error: unknown) {
      throw new InternalServerErrorException(
        `Lecture de ${chemin} impossible : ${getErrorMessage(error)}`
      );
    }
  }

  private async lire(contenu: string): Promise<EpciCommuneInsert[]> {
    const analyse = await this.csvService.getDataFromCsvContent<EpciPerimetre>(
      contenu,
      { schema: epciPerimetreSchema }
    );

    const lignes: EpciCommuneInsert[] = [];
    const vues = new Set<string>();

    for (const ligne of analyse.data) {
      const sirenEpci = ligne.siren.trim();
      const inseeCommune = ligne.insee.trim();
      const departementCode = ligne.dep_com.trim();
      const siegeDepartementCode = ligne.dept.trim();

      // La source finit par une ligne vide.
      if (!sirenEpci && !inseeCommune) {
        continue;
      }

      for (const [colonne, valeur] of Object.entries({
        siren: sirenEpci,
        insee: inseeCommune,
        dep_com: departementCode,
        dept: siegeDepartementCode,
      })) {
        if (!this.estAscii(valeur)) {
          throw new UnprocessableEntityException(
            `Caractère hors ASCII dans ${colonne} (${valeur}) — la source a changé d'encodage ou de colonnes`
          );
        }
      }

      if (!sirenEpci || !inseeCommune || !departementCode || !siegeDepartementCode) {
        throw new UnprocessableEntityException(
          `Ligne incomplète pour l'EPCI ${sirenEpci || '?'} et la commune ${
            inseeCommune || '?'
          }`
        );
      }

      // La clé primaire ne pardonne pas un doublon, et le rejeu doit échouer
      // avant d'avoir vidé la table plutôt qu'au milieu de son remplissage.
      const cle = `${sirenEpci}/${inseeCommune}`;
      if (vues.has(cle)) {
        throw new UnprocessableEntityException(
          `La commune ${inseeCommune} apparaît deux fois pour l'EPCI ${sirenEpci}`
        );
      }
      vues.add(cle);

      lignes.push({
        sirenEpci,
        inseeCommune,
        departementCode,
        siegeDepartementCode,
      });
    }

    if (lignes.length < this.MIN_LIGNES) {
      throw new UnprocessableEntityException(
        `Source tronquée : ${lignes.length} lignes lues, au moins ${this.MIN_LIGNES} attendues — les périmètres restent en l'état`
      );
    }

    const epci = new Set(lignes.map(({ sirenEpci }) => sirenEpci)).size;
    if (epci < this.MIN_EPCI) {
      throw new UnprocessableEntityException(
        `Source tronquée : ${epci} EPCI lus, au moins ${this.MIN_EPCI} attendus — les périmètres restent en l'état`
      );
    }

    // Une ligne écartée est un accès retiré, pas une statistique : le plancher de
    // volume ne l'attraperait pas — 4 000 lignes peuvent disparaître sans passer
    // sous la barre. `CsvService` les met de côté en silence, on refuse plutôt.
    if (analyse.errors.length > 0) {
      throw new UnprocessableEntityException(
        `${
          analyse.errors.length
        } ligne(s) refusée(s) par le schéma — la source a changé de forme : ${analyse.errors
          .slice(0, 5)
          .join(' ; ')}`
      );
    }

    return lignes;
  }

  /**
   * Le calcul ne lit que des codes, tous ASCII. La source est publiée en cp1252
   * et lue en utf-8 — ce qui abîme les libellés accentués, sans conséquence tant
   * qu'on n'en reprend aucun. Un caractère hors ASCII dans l'une des quatre
   * colonnes retenues signalerait un décalage de colonnes ou un changement
   * d'encodage, et là il faudrait s'arrêter.
   */
  private estAscii(valeur: string): boolean {
    for (const caractere of valeur) {
      if ((caractere.codePointAt(0) ?? 0) > 0x7f) {
        return false;
      }
    }
    return true;
  }

  /**
   * Le remplacement et le calcul dans la même transaction : un rejeu qui échoue
   * laisse les périmètres précédents en place plutôt qu'une table vide et des
   * accès disparus.
   */
  private async remplacerEtRecalculer(
    lignes: EpciCommuneInsert[]
  ): Promise<number> {
    return this.database.db.transaction(async (tx) => {
      // La source est un instantané, pas un journal : une commune sortie d'un
      // EPCI ne doit pas laisser sa ligne derrière elle.
      await tx.delete(epciCommuneTable);

      for (const lot of chunk(lignes, this.TAILLE_LOT)) {
        await tx.insert(epciCommuneTable).values(lot);
      }

      const resultat = await tx.execute<{ perimetres: number }>(
        sql`select imports.update_epci_perimetres_from_banatic() as perimetres`
      );

      return Number(resultat.rows[0]?.perimetres ?? 0);
    });
  }
}
