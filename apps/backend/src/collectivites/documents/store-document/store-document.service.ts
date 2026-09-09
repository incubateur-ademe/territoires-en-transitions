import { Injectable, Logger } from '@nestjs/common';
import { collectiviteBucketTable } from '@tet/backend/collectivites/shared/models/collectivite-bucket.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import SupabaseService from '@tet/backend/utils/database/supabase.service';
import { Result } from '@tet/backend/utils/result.type';
import {
  BibliothequeFichier,
  BibliothequeFichierCreate,
  DocumentHash,
} from '@tet/domain/collectivites';
import { ResourceType } from '@tet/domain/users';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import * as mime from 'mime-types';
import { bibliothequeFichierTable } from '../models/bibliotheque-fichier.table';
import { storageObjectTable } from '../models/storage-object.table';
import { calculateDocumentHash } from './calculate-document-hash.utils';
import {
  StoreDocumentError,
  StoreDocumentErrorEnum,
} from './store-document.errors';

// Type for multer file upload
type MulterFile = Express.Multer.File;

export type DocumentToUpload = Omit<BibliothequeFichierCreate, 'hash'>;

@Injectable()
export class StoreDocumentService {
  private readonly logger = new Logger(StoreDocumentService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly supabaseService: SupabaseService
  ) {}

  async getCollectiviteBucketId(
    collectiviteId: number
  ): Promise<
    Result<string, typeof StoreDocumentErrorEnum.COLLECTIVITE_BUCKET_NOT_FOUND>
  > {
    const buckets = await this.databaseService.db
      .select({ bucketId: collectiviteBucketTable.bucketId })
      .from(collectiviteBucketTable)
      .where(eq(collectiviteBucketTable.collectiviteId, collectiviteId));
    if (!buckets?.length) {
      return {
        success: false,
        error: StoreDocumentErrorEnum.COLLECTIVITE_BUCKET_NOT_FOUND,
      };
    }
    return {
      success: true,
      data: buckets[0].bucketId,
    };
  }

  async uploadLocalFile(
    document: DocumentToUpload,
    localFilePath: string,
    user?: AuthenticatedUser
  ): Promise<Result<BibliothequeFichier, StoreDocumentError>> {
    if (user) {
      const permissionResult = await this.permissionService.isAllowed(
        user,
        'collectivites.documents.mutate',
        ResourceType.COLLECTIVITE,
        { collectiviteId: document.collectiviteId }
      );
      if (!permissionResult.success) {
        return {
          success: false,
          error: 'UNAUTHORIZED',
        };
      }
    }

    const bucketResult = await this.getCollectiviteBucketId(
      document.collectiviteId
    );
    if (!bucketResult.success) {
      return bucketResult;
    }
    const bucketId = bucketResult.data;

    const mimeType = mime.lookup(localFilePath) || undefined;

    const fileBufferResult = await this.readLocalFile(localFilePath);
    if (!fileBufferResult.success) {
      return fileBufferResult;
    }
    const fileBuffer = fileBufferResult.data;
    const hash = calculateDocumentHash(fileBuffer);

    this.logger.log(
      `Uploading file ${localFilePath} with mime type ${mimeType} to bucket ${bucketId} with hash ${hash}`
    );

    const saveResult = await this.supabaseService.saveInStorage({
      bucket: bucketId,
      path: hash,
      file: fileBuffer,
      mimeType,
    });
    if (!saveResult.success) {
      return saveResult;
    }

    return await this.storeDocument({ ...document, hash }, user);
  }

  private async readLocalFile(
    localFilePath: string
  ): Promise<
    Result<Buffer, typeof StoreDocumentErrorEnum.UPLOAD_STORAGE_ERROR>
  > {
    try {
      return { success: true, data: await readFile(localFilePath) };
    } catch (error) {
      this.logger.error(
        `Cannot read local file ${localFilePath}: ${getErrorMessage(error)}`
      );
      return {
        success: false,
        error: StoreDocumentErrorEnum.UPLOAD_STORAGE_ERROR,
      };
    }
  }

  private async findDocumentByHash(
    collectiviteId: number,
    hash: DocumentHash
  ): Promise<BibliothequeFichier | undefined> {
    const [document] = await this.databaseService.db
      .select({
        id: bibliothequeFichierTable.id,
        collectiviteId: bibliothequeFichierTable.collectiviteId,
        hash: bibliothequeFichierTable.hash,
        filename: bibliothequeFichierTable.filename,
        confidentiel: bibliothequeFichierTable.confidentiel,
      })
      .from(bibliothequeFichierTable)
      .where(
        and(
          eq(bibliothequeFichierTable.collectiviteId, collectiviteId),
          eq(bibliothequeFichierTable.hash, hash)
        )
      )
      .limit(1);

    return document;
  }

  async uploadBuffer(
    collectiviteId: number,
    file: MulterFile,
    isConfidentiel: boolean,
    user?: AuthenticatedUser
  ): Promise<Result<BibliothequeFichier, StoreDocumentError>> {
    if (user) {
      const permissionResult = await this.permissionService.isAllowed(
        user,
        'collectivites.documents.mutate',
        ResourceType.COLLECTIVITE,
        { collectiviteId }
      );
      if (!permissionResult.success) {
        return {
          success: false,
          error: 'UNAUTHORIZED',
        };
      }
    }

    if (!file.buffer) {
      return {
        success: false,
        error: 'INVALID_FILE',
      };
    }

    const filename = file.originalname || 'uploaded-file';
    const mimeType = file.mimetype || mime.lookup(filename) || undefined;

    const bucketResult = await this.getCollectiviteBucketId(collectiviteId);
    if (!bucketResult.success) {
      return bucketResult;
    }
    const bucketId = bucketResult.data;

    const hash = calculateDocumentHash(file.buffer);

    this.logger.log(
      `Uploading buffer with mime type ${mimeType} to bucket ${bucketId} with hash ${hash}`
    );

    const saveResult = await this.supabaseService.saveInStorage({
      bucket: bucketId,
      path: hash,
      file: file.buffer,
      mimeType,
    });
    if (!saveResult.success) {
      return saveResult;
    }

    return await this.storeDocument(
      {
        collectiviteId,
        confidentiel: isConfidentiel,
        hash,
        filename,
      },
      user
    );
  }

  async storeDocument(
    document: BibliothequeFichierCreate,
    user?: AuthenticatedUser
  ): Promise<Result<BibliothequeFichier, StoreDocumentError>> {
    this.logger.log(
      `Création du document ${document.filename} pour la collectivité ${document.collectiviteId}`
    );

    if (user) {
      const permissionResult = await this.permissionService.isAllowed(
        user,
        'collectivites.documents.mutate',
        ResourceType.COLLECTIVITE,
        { collectiviteId: document.collectiviteId }
      );
      if (!permissionResult.success) {
        return {
          success: false,
          error: 'UNAUTHORIZED',
        };
      }
    }

    const existingStorageObject = await this.databaseService.db
      .select({ id: storageObjectTable.id })
      .from(storageObjectTable)
      .innerJoin(
        collectiviteBucketTable,
        eq(collectiviteBucketTable.bucketId, storageObjectTable.bucketId)
      )
      .where(
        and(
          eq(collectiviteBucketTable.collectiviteId, document.collectiviteId),
          eq(storageObjectTable.name, document.hash)
        )
      )
      .limit(1);

    if (!existingStorageObject.length) {
      return {
        success: false,
        error: 'STORAGE_OBJECT_NOT_FOUND',
      };
    }

    try {
      const [insertedDocument] = await this.databaseService.db
        .insert(bibliothequeFichierTable)
        .values({
          collectiviteId: document.collectiviteId,
          hash: document.hash,
          filename: document.filename,
          confidentiel: document.confidentiel ?? false,
        })
        .onConflictDoNothing({
          target: [
            bibliothequeFichierTable.collectiviteId,
            bibliothequeFichierTable.hash,
          ],
        })
        .returning();

      if (insertedDocument) {
        return {
          success: true,
          data: insertedDocument as BibliothequeFichier,
        };
      }

      const existingDocument = await this.findDocumentByHash(
        document.collectiviteId,
        document.hash
      );
      if (!existingDocument) {
        return { success: false, error: 'STORE_DOCUMENT_ERROR' };
      }

      return { success: true, data: existingDocument };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la création du document ${
          document.filename
        } : ${getErrorMessage(error)}`
      );
      return {
        success: false,
        error: 'STORE_DOCUMENT_ERROR',
      };
    }
  }
}
