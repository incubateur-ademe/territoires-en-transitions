import { Injectable, Logger } from '@nestjs/common';
import { collectiviteBucketTable } from '@tet/backend/collectivites/shared/models/collectivite-bucket.table';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import SupabaseService from '@tet/backend/utils/database/supabase.service';
import { MethodResult } from '@tet/backend/utils/result.type';
import {
  BibliothequeFichier,
  BibliothequeFichierCreate,
} from '@tet/domain/collectivites';
import { getErrorMessage } from '@tet/domain/utils';
import { eq } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import * as mime from 'mime-types';
import { DatabaseService } from '../../../utils/database/database.service';
import { CreateDocumentService } from '../create-document/create-document.service';
import {
  UploadDocumentError,
  UploadDocumentErrorEnum,
} from './upload-document.errors';

@Injectable()
export default class UploadDocumentService {
  private readonly logger = new Logger(UploadDocumentService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly supabaseService: SupabaseService,
    private readonly createDocumentService: CreateDocumentService
  ) {}

  async getCollectiviteBucketId(
    collectiviteId: number
  ): Promise<
    MethodResult<
      string,
      typeof UploadDocumentErrorEnum.COLLECTIVITE_BUCKET_NOT_FOUND
    >
  > {
    const buckets = await this.databaseService.db
      .select({ bucketId: collectiviteBucketTable.bucketId })
      .from(collectiviteBucketTable)
      .where(eq(collectiviteBucketTable.collectiviteId, collectiviteId));
    if (!buckets?.length) {
      return {
        success: false,
        error: UploadDocumentErrorEnum.COLLECTIVITE_BUCKET_NOT_FOUND,
      };
    }
    return {
      success: true,
      data: buckets[0].bucketId,
    };
  }

  async uploadLocalFile(
    document: BibliothequeFichierCreate,
    localFilePath: string,
    user: AuthenticatedUser
  ): Promise<MethodResult<BibliothequeFichier, UploadDocumentError>> {
    const bucketResult = await this.getCollectiviteBucketId(
      document.collectiviteId
    );
    if (!bucketResult.success) {
      return bucketResult;
    }
    const bucketId = bucketResult.data;

    const mimeType = mime.lookup(localFilePath) || undefined;

    this.logger.log(
      `Uploading file ${localFilePath} with mime type ${mimeType} to bucket ${bucketId} with hash ${document.hash}`
    );

    const fileBuffer = await readFile(localFilePath);
    const { data, error } = await this.supabaseService.client.storage
      .from(bucketId)
      .upload(document.hash, fileBuffer, {
        contentType: mimeType,
      });
    if (!data || error) {
      this.logger.error(
        `Error uploading file: ${
          error ? getErrorMessage(error) : 'Unknown error'
        }`
      );
      return {
        success: false,
        error: UploadDocumentErrorEnum.UPLOAD_STORAGE_ERROR,
      };
    }

    const createdDocument = await this.createDocumentService.createDocument(
      document,
      user
    );
    this.logger.log(`Created document ${createdDocument.id}`);

    /* TODO
    if (!createdDocument.success) {
      return createdDocument;
    }*/
    return {
      success: true,
      data: createdDocument,
    };
  }
}
