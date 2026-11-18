import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import type { DemarchePcaetRef } from '../shared/demarche-pcaet-ref.repository';
import {
  DEMARCHE_PCAET_EXPORT_TYPES,
  type DemarchePcaetExportTransition,
} from '../shared/models/demarche-pcaet-export.table';
import { BuildDemarchePcaetWorkbooksService } from './build-demarche-pcaet-workbooks.service';
import { DemarchePcaetExportRepository } from './demarche-pcaet-export.repository';
import { buildDemarchePcaetExportFilename } from './demarche-pcaet-export.rules';
import {
  buildDemarchePcaetExportPath,
  DemarchePcaetExportsStorageService,
} from './demarche-pcaet-exports-storage.service';
import {
  DemarchePcaetExportErrorEnum,
  type DemarchePcaetExportError,
} from './generate-demarche-pcaet-exports.errors';

/**
 * Fige les classeurs d'un dépôt au moment d'une soumission (transmission pour
 * avis, publication) : ils gardent le dossier tel qu'il était, même si le plan
 * est modifié ensuite.
 *
 * Appelé dans la transaction de la transition, et bloquant : pas d'export figé,
 * pas de soumission. Le stockage n'étant pas dans la transaction, l'appelant
 * garde les chemins renvoyés et les passe à `discard` si elle est annulée.
 */
@Injectable()
export class GenerateDemarchePcaetExportsService {
  private readonly logger = new Logger(
    GenerateDemarchePcaetExportsService.name
  );

  constructor(
    private readonly buildWorkbooksService: BuildDemarchePcaetWorkbooksService,
    private readonly storageService: DemarchePcaetExportsStorageService,
    private readonly exportRepository: DemarchePcaetExportRepository,
    private readonly collectivitesService: CollectivitesService
  ) {}

  async generate(
    {
      demarche,
      transition,
      userId,
    }: {
      demarche: Pick<DemarchePcaetRef, 'id' | 'collectiviteId'>;
      transition: DemarchePcaetExportTransition;
      userId: string;
    },
    tx: Transaction
  ): Promise<Result<{ storedPaths: string[] }, DemarchePcaetExportError>> {
    let storedPaths: string[] = [];
    try {
      const collectiviteResult =
        await this.collectivitesService.getCollectivite(
          demarche.collectiviteId,
          tx
        );
      if (!collectiviteResult.success) {
        return failure(
          DemarchePcaetExportErrorEnum.EXPORT_GENERATION_ERROR,
          collectiviteResult.cause
        );
      }
      const { collectivite } = collectiviteResult.data;

      // L'étape coûteuse, verrou de ligne tenu, vient après la lecture de la
      // collectivité : un échec de celle-ci ne la gaspille pas.
      const workbooks = await this.buildWorkbooksService.build(
        { demarcheId: demarche.id, collectiviteId: demarche.collectiviteId },
        tx
      );
      if (!workbooks.success) {
        return workbooks;
      }

      const now = new Date();
      const attemptId = randomUUID();
      const exports = DEMARCHE_PCAET_EXPORT_TYPES.flatMap((type) => {
        const content = workbooks.data[type];
        if (content === null) {
          return [];
        }
        return [
          {
            type,
            content,
            storagePath: buildDemarchePcaetExportPath({
              demarcheId: demarche.id,
              transition,
              attemptId,
              type,
            }),
            filename: buildDemarchePcaetExportFilename({
              collectiviteNom: collectivite.nom,
              type,
              transition,
              date: now,
            }),
          },
        ];
      });

      // Chaque essai écrit dans son propre dossier : un essai annulé ne
      // touche jamais aux classeurs d'un essai validé.
      const stored = await this.storageService.store(
        exports.map(({ storagePath, content }) => ({
          path: storagePath,
          content,
        }))
      );
      if (!stored.success) {
        this.logger.error(
          `Classeurs de la démarche PCAET ${
            demarche.id
          } (${transition}) non enregistrés dans le stockage : ${
            stored.cause?.message ?? stored.error
          }`
        );
        return failure(
          DemarchePcaetExportErrorEnum.EXPORT_GENERATION_ERROR,
          stored.cause
        );
      }
      storedPaths = exports.map(({ storagePath }) => storagePath);

      await this.exportRepository.replaceForTransition(
        {
          demarcheId: demarche.id,
          transition,
          exports: exports.map(({ type, storagePath, filename }) => ({
            type,
            storagePath,
            filename,
          })),
          userId,
        },
        tx
      );

      this.logger.log(
        `Classeurs de la démarche PCAET ${
          demarche.id
        } figés (${transition}) : ${
          exports.map(({ type }) => type).join(', ') || 'aucun'
        }`
      );
      return success({ storedPaths });
    } catch (error) {
      // La transaction est condamnée et tient encore le verrou de ligne : le
      // retrait ne la retarde pas, il part en arrière-plan.
      void this.storageService.discard(storedPaths);
      this.logger.error(
        `Échec de la génération des classeurs de la démarche PCAET ${
          demarche.id
        } (${transition}) : ${getErrorMessage(error)}`
      );
      return failure(
        DemarchePcaetExportErrorEnum.EXPORT_GENERATION_ERROR,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Retire les classeurs d'une transition dont la transaction a échoué. Un
   * échec du COMMIT est ambigu (la base a pu valider) : on ne retire que les
   * chemins qu'aucune ligne commitée ne désigne. Si la base ne répond pas, on
   * garde tout, un orphelin valant mieux qu'un classeur validé perdu.
   */
  async discard(storedPaths: string[]): Promise<void> {
    if (storedPaths.length === 0) {
      return;
    }
    try {
      const referenced = new Set(
        await this.exportRepository.listReferencedStoragePaths(storedPaths)
      );
      await this.storageService.discard(
        storedPaths.filter((path) => !referenced.has(path))
      );
    } catch (error) {
      this.logger.warn(
        `Classeurs ${storedPaths.join(
          ', '
        )} gardés : leurs lignes de suivi n'ont pas pu être relues (${getErrorMessage(
          error
        )})`
      );
    }
  }
}
