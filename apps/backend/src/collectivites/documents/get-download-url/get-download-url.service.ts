import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { CollectiviteBucketRepository } from '../collectivite-bucket.repository';
import { CollectiviteDocumentsAccessService } from '../collectivite-documents-access.service';
import {
  GetDownloadUrlError,
  GetDownloadUrlErrorEnum,
} from './get-download-url.errors';
import { GetDownloadUrlInput } from './get-download-url.input';
import { GetDownloadUrlOutput } from './get-download-url.output';
import { GetDownloadUrlRepository } from './get-download-url.repository';

const DOWNLOAD_URL_TTL_SECONDS = 60;

@Injectable()
export class GetDownloadUrlService {
  constructor(
    private readonly collectiviteDocumentsAccess: CollectiviteDocumentsAccessService,
    private readonly repository: GetDownloadUrlRepository,
    private readonly collectiviteBucketRepository: CollectiviteBucketRepository,
    private readonly documentStorageService: DocumentStorageService
  ) {}

  async getDownloadUrl(
    { collectiviteId, fichierId }: GetDownloadUrlInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<GetDownloadUrlOutput, GetDownloadUrlError>> {
    const accessResult =
      await this.collectiviteDocumentsAccess.checkUserCanReadDocuments(
        { collectiviteId },
        { user, tx }
      );
    if (!accessResult.success) {
      return failure(GetDownloadUrlErrorEnum.UNAUTHORIZED);
    }
    const { canReadConfidentiel } = accessResult.data;

    const document = await this.repository.findDocument({
      collectiviteId,
      fichierId,
    });
    if (document === undefined) {
      return failure(GetDownloadUrlErrorEnum.DOCUMENT_NOT_FOUND);
    }

    const isDocumentOutOfReach =
      document.confidentiel === true && !canReadConfidentiel;
    if (isDocumentOutOfReach) {
      return failure(GetDownloadUrlErrorEnum.DOCUMENT_NOT_FOUND);
    }

    const bucketId = await this.collectiviteBucketRepository.findBucketId(
      collectiviteId
    );
    if (bucketId === undefined) {
      return failure(GetDownloadUrlErrorEnum.COLLECTIVITE_BUCKET_NOT_FOUND);
    }

    const signedUrlResult =
      await this.documentStorageService.createSignedDownloadUrl({
        bucketId,
        key: document.hash,
        expiresInSeconds: DOWNLOAD_URL_TTL_SECONDS,
      });
    if (!signedUrlResult.success) {
      return failure(
        GetDownloadUrlErrorEnum.SIGN_DOWNLOAD_ERROR,
        signedUrlResult.cause
      );
    }

    return success({
      signedUrl: signedUrlResult.data.signedUrl,
      filename: document.filename,
    });
  }
}
