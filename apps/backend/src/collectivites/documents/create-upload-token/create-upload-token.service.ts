import { Injectable, Logger } from '@nestjs/common';
import { BibliothequeFichierRepository } from '@tet/backend/collectivites/documents/bibliotheque-fichier.repository';
import { CollectiviteBucketRepository } from '@tet/backend/collectivites/documents/collectivite-bucket.repository';
import { StorageObjectRepository } from '@tet/backend/collectivites/documents/storage-object.repository';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { UploadDecisionKindEnum } from '@tet/domain/collectivites';
import { ResourceType } from '@tet/domain/users';
import {
  CreateUploadTokenError,
  CreateUploadTokenErrorEnum,
} from './create-upload-token.errors';
import { CreateUploadTokenInput } from './create-upload-token.input';
import { CreateUploadTokenOutput } from './create-upload-token.output';

@Injectable()
export class CreateUploadTokenService {
  private readonly logger = new Logger(CreateUploadTokenService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly bibliothequeFichierRepository: BibliothequeFichierRepository,
    private readonly collectiviteBucketRepository: CollectiviteBucketRepository,
    private readonly documentStorageService: DocumentStorageService,
    private readonly storageObjectRepository: StorageObjectRepository
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
      collectiviteId,
      tx
    );
    if (bucketId === undefined) {
      return failure(CreateUploadTokenErrorEnum.COLLECTIVITE_BUCKET_NOT_FOUND);
    }

    const fichier = await this.bibliothequeFichierRepository.findByHash(
      { collectiviteId, hash },
      tx
    );
    if (fichier !== undefined) {
      return success({
        kind: UploadDecisionKindEnum.ALREADY_IN_BIBLIOTHEQUE,
        fichierId: fichier.id,
        filename: fichier.filename,
      });
    }

    // Un envoi peut réussir avant que la création en bibliothèque échoue.
    // Réutiliser l'objet évite de signer un nouvel envoi au même emplacement,
    // refusé par le stockage avec upsert: false.
    const isStored = await this.storageObjectRepository.existsInBucket(
      { bucketId, hash },
      tx
    );
    if (isStored) {
      return success({ kind: UploadDecisionKindEnum.ALREADY_IN_STORAGE });
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
      kind: UploadDecisionKindEnum.READY_TO_UPLOAD,
      token: signedUploadResult.data.token,
      bucketId,
      path: signedUploadResult.data.path,
    });
  }
}
