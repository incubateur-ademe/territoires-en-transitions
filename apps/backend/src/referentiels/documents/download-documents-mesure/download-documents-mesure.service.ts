import { Injectable, Logger } from '@nestjs/common';
import { ListDocumentsByScopeRepository } from '@tet/backend/collectivites/documents/list-documents-by-scope/list-documents-by-scope.repository';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import type { ArchiveFolderArborescence } from '@tet/backend/utils/archive/archive-arborescence.types';
import { ArchiveAssemblyService } from '@tet/backend/utils/archive/archive-assembly.service';
import { checkArchiveLimits } from '@tet/backend/utils/archive/check-archive-limits.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { tryGetReferentielIdFromActionId } from '@tet/domain/referentiels';
import type { Writable } from 'node:stream';
import { ReferentielDocumentsAccessService } from '../referentiel-documents-access.service';
import {
  DownloadDocumentsMesureError,
  DownloadDocumentsMesureErrorEnum,
} from './download-documents-mesure.errors';
import { DownloadDocumentsMesureInput } from './download-documents-mesure.input';
import {
  toArchiveArborescence,
  toArchiveFilename,
} from './to-archive-arborescence';

const SYNCHRONOUS_ARCHIVE_LIMITS = {
  maxFileCount: 100,
  maxTotalSizeBytes: 500 * 1024 * 1024,
};

export type PreparedMesureArchive = {
  filename: string;
  writeTo: (
    destination: Writable
  ) => Promise<Result<{ totalFiles: number }, DownloadDocumentsMesureError>>;
};

@Injectable()
export class DownloadDocumentsMesureService {
  private readonly logger = new Logger(DownloadDocumentsMesureService.name);

  constructor(
    private readonly documents: ListDocumentsByScopeRepository,
    private readonly referentielDocumentsAccess: ReferentielDocumentsAccessService,
    private readonly collectivitesService: CollectivitesService,
    private readonly archiveAssemblyService: ArchiveAssemblyService
  ) {}

  async prepareArchive(
    { collectiviteId, actionId }: DownloadDocumentsMesureInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<PreparedMesureArchive, DownloadDocumentsMesureError>> {
    const referentielId = tryGetReferentielIdFromActionId(actionId);
    if (!referentielId) {
      return failure(DownloadDocumentsMesureErrorEnum.UNKNOWN_REFERENTIEL);
    }

    const accessResult =
      await this.referentielDocumentsAccess.checkUserCanReadDocuments(
        { collectiviteId, referentielId },
        { user, tx }
      );
    if (!accessResult.success) {
      return failure(DownloadDocumentsMesureErrorEnum.UNAUTHORIZED);
    }

    const documentsResult = await this.documents.listDocuments({
      kind: 'mesure',
      collectiviteId,
      actionId,
      withSubActions: true,
      canReadConfidentiel: accessResult.data.canReadConfidentiel,
    });
    if (!documentsResult.success) {
      return failure(
        DownloadDocumentsMesureErrorEnum.SERVER_ERROR,
        documentsResult.cause
      );
    }

    const arborescence = toArchiveArborescence(documentsResult.data);
    if (arborescence.files.length === 0) {
      return failure(DownloadDocumentsMesureErrorEnum.NO_DOCUMENT);
    }

    const limitsCheck = checkArchiveLimits(
      arborescence.files,
      SYNCHRONOUS_ARCHIVE_LIMITS
    );
    if (!limitsCheck.withinLimits) {
      this.logger.warn(
        `Archive of mesure ${actionId} refused: ${limitsCheck.exceeded} limit exceeded (limit ${limitsCheck.limit})`
      );
      return failure(DownloadDocumentsMesureErrorEnum.ARCHIVE_TOO_LARGE);
    }

    const { collectivite } = await this.collectivitesService.getCollectivite(
      collectiviteId,
      tx
    );

    return success({
      filename: toArchiveFilename({
        referentielId,
        actionId,
        collectiviteNom: collectivite.nom,
      }),
      writeTo: (destination: Writable) =>
        this.writeArchive(arborescence, destination),
    });
  }

  private async writeArchive(
    arborescence: ArchiveFolderArborescence,
    destination: Writable
  ): Promise<Result<{ totalFiles: number }, DownloadDocumentsMesureError>> {
    const assembleResult = await this.archiveAssemblyService.assembleZip({
      arborescence,
      destination,
    });
    if (!assembleResult.success) {
      return failure(DownloadDocumentsMesureErrorEnum.BUILD_ARCHIVE_ERROR);
    }
    return success(assembleResult.data);
  }
}
