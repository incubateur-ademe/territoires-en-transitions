import { Injectable, Logger } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import type { Writable } from 'node:stream';
import { checkArchiveLimits } from '../../preuves-archive/build-archive/archive-limits';
import { BuildArchiveService } from '../../preuves-archive/build-archive/build-archive.service';
import type { ArchiveFolderArborescence } from '../../preuves-archive/build-archive/archive-arborescence';
import {
  ListDocumentsMesureError,
  ListDocumentsMesureErrorEnum,
} from '../list-documents-mesure/list-documents-mesure.errors';
import { ListDocumentsMesureService } from '../list-documents-mesure/list-documents-mesure.service';
import {
  DownloadDocumentsMesureError,
  DownloadDocumentsMesureErrorEnum,
} from './download-documents-mesure.errors';
import { DownloadDocumentsMesureInput } from './download-documents-mesure.input';
import { toArchiveArborescence, toArchiveFilename } from './to-archive-arborescence';

export type PreparedMesureArchive = {
  filename: string;
  writeTo: (
    destination: Writable
  ) => Promise<Result<{ totalFiles: number }, DownloadDocumentsMesureError>>;
};

const DOWNLOAD_ERROR_BY_LIST_ERROR: Record<
  ListDocumentsMesureError,
  DownloadDocumentsMesureError
> = {
  [ListDocumentsMesureErrorEnum.UNKNOWN_REFERENTIEL]:
    DownloadDocumentsMesureErrorEnum.UNKNOWN_REFERENTIEL,
  [ListDocumentsMesureErrorEnum.DOCUMENT_SCHEMA_MISMATCH]:
    DownloadDocumentsMesureErrorEnum.SERVER_ERROR,
  [ListDocumentsMesureErrorEnum.UNAUTHORIZED]:
    DownloadDocumentsMesureErrorEnum.UNAUTHORIZED,
  [ListDocumentsMesureErrorEnum.SERVER_ERROR]:
    DownloadDocumentsMesureErrorEnum.SERVER_ERROR,
  [ListDocumentsMesureErrorEnum.DATABASE_ERROR]:
    DownloadDocumentsMesureErrorEnum.DATABASE_ERROR,
  [ListDocumentsMesureErrorEnum.NOT_FOUND]:
    DownloadDocumentsMesureErrorEnum.NOT_FOUND,
};

@Injectable()
export class DownloadDocumentsMesureService {
  private readonly logger = new Logger(DownloadDocumentsMesureService.name);

  constructor(
    private readonly listDocumentsMesureService: ListDocumentsMesureService,
    private readonly collectivitesService: CollectivitesService,
    private readonly buildArchiveService: BuildArchiveService
  ) {}

  async prepareArchive(
    { collectiviteId, actionId }: DownloadDocumentsMesureInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<PreparedMesureArchive, DownloadDocumentsMesureError>> {
    const documentsResult =
      await this.listDocumentsMesureService.listDocumentsMesure(
        { collectiviteId, actionId, withSubActions: true },
        { user, tx }
      );
    if (!documentsResult.success) {
      return failure(DOWNLOAD_ERROR_BY_LIST_ERROR[documentsResult.error]);
    }

    const arborescence = toArchiveArborescence(documentsResult.data);
    if (arborescence.files.length === 0) {
      return failure(DownloadDocumentsMesureErrorEnum.NO_DOCUMENT);
    }

    const limitsCheck = checkArchiveLimits(arborescence.files);
    if (!limitsCheck.withinLimits) {
      this.logger.warn(
        `Archive de la mesure ${actionId} refusée: ${limitsCheck.reason}`
      );
      return failure(DownloadDocumentsMesureErrorEnum.ARCHIVE_TOO_LARGE);
    }

    const { collectivite } = await this.collectivitesService.getCollectivite(
      collectiviteId,
      tx
    );

    return success({
      filename: toArchiveFilename({
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
    const assembleResult = await this.buildArchiveService.assembleZip({
      arborescence,
      destination,
    });
    if (!assembleResult.success) {
      return failure(DownloadDocumentsMesureErrorEnum.BUILD_ARCHIVE_ERROR);
    }
    return success(assembleResult.data);
  }
}
