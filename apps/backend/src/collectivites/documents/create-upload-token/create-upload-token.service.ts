import { Injectable, Logger } from '@nestjs/common';
import { CollectiviteBucketRepository } from '@tet/backend/collectivites/documents/collectivite-bucket.repository';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { ResourceType } from '@tet/domain/users';
import {
  CreateUploadTokenError,
  CreateUploadTokenErrorEnum,
} from './create-upload-token.errors';
import { CreateUploadTokenInput } from './create-upload-token.input';
import { CreateUploadTokenOutput } from './create-upload-token.output';
import { CreateUploadTokenRepository } from './create-upload-token.repository';

@Injectable()
export class CreateUploadTokenService {
  private readonly logger = new Logger(CreateUploadTokenService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly repository: CreateUploadTokenRepository,
    private readonly collectiviteBucketRepository: CollectiviteBucketRepository,
    private readonly documentStorageService: DocumentStorageService
  ) {}

  async createUploadToken(
    { collectiviteId, hash }: CreateUploadTokenInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<CreateUploadTokenOutput, CreateUploadTokenError>> {
    const permissionResult = await this.permissionService.isAllowed(
      user,
      'collectivites.documents.mutate',
      ResourceType.COLLECTIVITE,
      { collectiviteId },
      tx
    );
    if (!permissionResult.success) {
      return failure(CreateUploadTokenErrorEnum.UNAUTHORIZED);
    }

    const bucketId = await this.collectiviteBucketRepository.findBucketId(
      collectiviteId
    );
    if (bucketId === undefined) {
      return failure(CreateUploadTokenErrorEnum.COLLECTIVITE_BUCKET_NOT_FOUND);
    }

    const fichier = await this.repository.findFichierByHash({
      collectiviteId,
      hash,
    });
    if (fichier !== undefined) {
      return success({
        kind: 'alreadyInBibliotheque',
        fichierId: fichier.id,
        filename: fichier.filename,
      });
    }

    const signedUploadResult =
      await this.documentStorageService.createSignedUpload({
        bucketId,
        key: hash,
      });
    if (!signedUploadResult.success) {
      return failure(
        CreateUploadTokenErrorEnum.SIGN_UPLOAD_ERROR,
        signedUploadResult.cause
      );
    }

    this.logger.log(`Upload token issued for hash ${hash}`);

    return success({
      kind: 'readyToUpload',
      token: signedUploadResult.data.token,
      bucketId,
      path: signedUploadResult.data.path,
    });
  }
}
