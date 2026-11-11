import { Injectable, Logger } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { StatutTrajectoireSnbc3 } from '@tet/domain/indicateurs';
import { getSnbc3CodeTerritoire } from '../import-snbc3/snbc3-collectivite-key';
import { Snbc3ReleaseStorageService } from '../import-snbc3/snbc3-release-storage.service';
import {
  TrajectoireSnbc3Error,
  TrajectoireSnbc3ErrorEnum,
} from '../snbc3/trajectoire-snbc3.errors';
import { TrajectoireSnbc3Service } from '../snbc3/trajectoire-snbc3.service';
import { TrajectoireSnbc3FeatureFlagService } from '../trajectoire-snbc3-feature-flag.service';
import { selectTerritoireInSnbc3Workbook } from './select-territoire-in-snbc3-workbook';

export type Snbc3Workbook = { content: Buffer; fileName: string };

/**
 * Export du classeur standalone SNBC 3 stocké par l'import (lot 5 du plan
 * SNBC 3) : tel qu'il est publié (« Outil Excel SNBC 3 »), ou ouvert sur le
 * territoire de la collectivité (« Mes données »). Réservé aux utilisateurs
 * qui ont le flag `is-trajectoire-snbc3-enabled`.
 */
@Injectable()
export class ExportTrajectoireSnbc3Service {
  private readonly logger = new Logger(ExportTrajectoireSnbc3Service.name);

  /**
   * Dernier classeur lu dans le bucket (~1,6 Mo), par version de l'objet
   * stocké : un réimport, qui le réécrit, invalide le cache.
   */
  private cache: {
    version: string;
    content: Promise<Result<Buffer, unknown>>;
  } | null = null;

  constructor(
    private readonly featureFlag: TrajectoireSnbc3FeatureFlagService,
    private readonly trajectoireSnbc3Service: TrajectoireSnbc3Service,
    private readonly releaseStorage: Snbc3ReleaseStorageService
  ) {}

  /**
   * Le classeur tel qu'il est publié, sous son nom d'origine. Le fichier est
   * public, la collectivité ne sert qu'à évaluer le flag.
   */
  async getWorkbook(
    { collectiviteId }: { collectiviteId: number },
    { user }: ServiceSecondArg
  ): Promise<Result<Snbc3Workbook, TrajectoireSnbc3Error>> {
    if (
      !(await this.featureFlag.isTrajectoireSnbc3Enabled(user, collectiviteId))
    ) {
      return failure(TrajectoireSnbc3ErrorEnum.TRAJECTOIRE_SNBC3_NON_OUVERTE);
    }
    return this.readWorkbook();
  }

  /** Le classeur ouvert sur le territoire de la collectivité. */
  async getCollectiviteWorkbook(
    { collectiviteId }: { collectiviteId: number },
    { user }: ServiceSecondArg
  ): Promise<Result<Snbc3Workbook, TrajectoireSnbc3Error>> {
    // Flag, collectivité et droits de lecture : comme la page Trajectoire.
    const statut = await this.trajectoireSnbc3Service.resolveStatut(
      { collectiviteId },
      { user }
    );
    if (!statut.success) {
      return statut;
    }
    const { status, collectivite } = statut.data;
    if (status === StatutTrajectoireSnbc3.DROITS_INSUFFISANTS) {
      return failure(TrajectoireSnbc3ErrorEnum.UNAUTHORIZED);
    }
    if (status !== StatutTrajectoireSnbc3.DISPONIBLE) {
      return failure(TrajectoireSnbc3ErrorEnum.TRAJECTOIRE_NON_DISPONIBLE);
    }

    const code = getSnbc3CodeTerritoire(collectivite);
    if (!code) {
      this.logger.error(
        `Collectivité ${collectiviteId} dans le millésime SNBC 3 sans code de territoire (SIREN ou code commune)`
      );
      return failure(TrajectoireSnbc3ErrorEnum.TERRITOIRE_NOT_IN_WORKBOOK);
    }

    // L'import remplace les valeurs avant d'écrire le classeur : entre les
    // deux, ou après un échec, le classeur stocké est celui de la release
    // précédente.
    if (await this.releaseStorage.hasUnfinishedImport()) {
      return this.failUnfinishedImport(collectiviteId);
    }

    const workbook = await this.readWorkbook();
    if (!workbook.success) {
      return workbook;
    }
    const selected = await selectTerritoireInSnbc3Workbook(
      workbook.data.content,
      code
    );
    if (!selected.success) {
      this.logger.error(
        selected.error === 'TERRITOIRE_NOT_IN_WORKBOOK'
          ? `Territoire ${code} (collectivité ${collectiviteId}) absent du classeur SNBC 3 alors qu'il a des valeurs : parquet et classeur désynchronisés`
          : `Classeur SNBC 3 (${workbook.data.fileName}) non reconnu : onglet Territoire introuvable ou de structure inattendue`
      );
      return failure(selected.error);
    }

    // Un import commencé pendant la lecture ou l'adaptation est encore en
    // cours, ou a réécrit le classeur s'il est allé au bout : le classeur lu
    // n'est alors plus celui des valeurs.
    const [unfinished, info] = await Promise.all([
      this.releaseStorage.hasUnfinishedImport(),
      this.releaseStorage.getWorkbookInfo(),
    ]);
    if (unfinished || info?.version !== workbook.data.version) {
      return this.failUnfinishedImport(collectiviteId);
    }

    return success({
      content: selected.data,
      fileName: `Trajectoire SNBC3 - ${code} - ${collectivite.nom}.xlsx`,
    });
  }

  private failUnfinishedImport(collectiviteId: number) {
    this.logger.warn(
      `Classeur SNBC 3 de la collectivité ${collectiviteId} refusé : import complet inachevé`
    );
    return failure(TrajectoireSnbc3ErrorEnum.SNBC3_IMPORT_UNFINISHED);
  }

  /** Le classeur stocké, et la version de l'objet lue avant le contenu. */
  private async readWorkbook(): Promise<
    Result<Snbc3Workbook & { version: string }, TrajectoireSnbc3Error>
  > {
    const info = await this.releaseStorage.getWorkbookInfo();
    if (!info) {
      return failure(TrajectoireSnbc3ErrorEnum.WORKBOOK_NOT_FOUND);
    }

    if (this.cache?.version !== info.version) {
      this.cache = {
        version: info.version,
        content: this.releaseStorage.downloadWorkbook(),
      };
    }
    const entry = this.cache;
    const content = await entry.content;
    if (!content.success) {
      // pas de cache d'un échec de lecture, sans effacer une version plus
      // récente posée entre-temps par une requête concurrente
      if (this.cache === entry) {
        this.cache = null;
      }
      this.logger.error('Lecture du classeur SNBC 3 dans le bucket en échec');
      return failure(TrajectoireSnbc3ErrorEnum.SERVER_ERROR);
    }
    return success({
      content: content.data,
      fileName: info.fileName,
      version: info.version,
    });
  }
}
