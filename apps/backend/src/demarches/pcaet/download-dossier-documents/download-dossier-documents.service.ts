import { Injectable, Logger } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { DemarcheDocumentsRepository } from '@tet/backend/demarches/shared/demarche-documents.repository';
import type { ArchiveFolderArborescence } from '@tet/backend/utils/archive/archive-arborescence.types';
import { ArchiveAssemblyService } from '@tet/backend/utils/archive/archive-assembly.service';
import { checkArchiveLimits } from '@tet/backend/utils/archive/check-archive-limits.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { DemarcheTypeEnum } from '@tet/domain/demarches';
import type { Writable } from 'node:stream';
import { DepotPermissionsService } from '../shared/depot-permissions.service';
import type { DossierInstructionRef } from '../shared/dossier-instruction-ref.input';
import {
  DownloadDossierDocumentsError,
  DownloadDossierDocumentsErrorEnum,
} from './download-dossier-documents.errors';
import {
  toDossierArchiveArborescence,
  toDossierArchiveFilename,
} from './to-dossier-archive-arborescence';

/** Mêmes bornes que l'archive d'une mesure : l'archive se construit en direct. */
const SYNCHRONOUS_ARCHIVE_LIMITS = {
  maxFileCount: 100,
  maxTotalSizeBytes: 500 * 1024 * 1024,
};

export type PreparedDossierArchive = {
  filename: string;
  writeTo: (
    destination: Writable
  ) => Promise<Result<{ totalFiles: number }, DownloadDossierDocumentsError>>;
};

@Injectable()
export class DownloadDossierDocumentsService {
  private readonly logger = new Logger(DownloadDossierDocumentsService.name);

  constructor(
    private readonly depotPermissionsService: DepotPermissionsService,
    private readonly demarcheDocumentsRepository: DemarcheDocumentsRepository,
    private readonly collectivitesService: CollectivitesService,
    private readonly archiveAssemblyService: ArchiveAssemblyService
  ) {}

  /**
   * Tout ce qui peut échouer avant l'envoi des en-têtes : droit de lecture,
   * présence de documents, volume. L'écriture du zip vient ensuite.
   */
  async prepareArchive(
    ref: DossierInstructionRef,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<PreparedDossierArchive, DownloadDossierDocumentsError>> {
    const consultableResult =
      await this.depotPermissionsService.canConsulterDossier(ref, {
        user,
        tx,
      });
    if (!consultableResult.success) {
      return failure(
        consultableResult.error === 'DEMANDE_AVIS_NOT_FOUND'
          ? DownloadDossierDocumentsErrorEnum.DEMANDE_AVIS_NOT_FOUND
          : consultableResult.error === 'NOT_FOUND'
          ? DownloadDossierDocumentsErrorEnum.DEMARCHE_PCAET_NOT_FOUND
          : DownloadDossierDocumentsErrorEnum.UNAUTHORIZED
      );
    }
    const { demarcheId, collectiviteId } = consultableResult.data;

    const snapshot = await this.demarcheDocumentsRepository.loadSnapshot(
      {
        demarcheId,
        demarcheType: DemarcheTypeEnum.PCAET,
        collectiviteId,
      },
      tx
    );

    const arborescence = toDossierArchiveArborescence(snapshot);
    if (arborescence.files.length === 0) {
      return failure(DownloadDossierDocumentsErrorEnum.NO_DOCUMENT);
    }

    const limitsCheck = checkArchiveLimits(
      arborescence.files,
      SYNCHRONOUS_ARCHIVE_LIMITS
    );
    if (!limitsCheck.withinLimits) {
      this.logger.warn(
        `Archive of demarche ${demarcheId} refused: ${limitsCheck.exceeded} limit exceeded (limit ${limitsCheck.limit})`
      );
      return failure(DownloadDossierDocumentsErrorEnum.ARCHIVE_TOO_LARGE);
    }

    const { collectivite } = await this.collectivitesService.getCollectivite(
      collectiviteId,
      tx
    );

    return success({
      filename: toDossierArchiveFilename(collectivite.nom),
      writeTo: (destination: Writable) =>
        this.writeArchive(arborescence, destination),
    });
  }

  private async writeArchive(
    arborescence: ArchiveFolderArborescence,
    destination: Writable
  ): Promise<Result<{ totalFiles: number }, DownloadDossierDocumentsError>> {
    const assembleResult = await this.archiveAssemblyService.assembleZip({
      arborescence,
      destination,
    });
    if (!assembleResult.success) {
      return failure(DownloadDossierDocumentsErrorEnum.BUILD_ARCHIVE_ERROR);
    }
    return success(assembleResult.data);
  }
}
