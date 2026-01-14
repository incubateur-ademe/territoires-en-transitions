import { Injectable, Logger } from '@nestjs/common';
import { collectiviteBucketTable } from '@tet/backend/collectivites/shared/models/collectivite-bucket.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ResourceType } from '@tet/backend/users/authorizations/resource-type.enum';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import SupabaseService from '@tet/backend/utils/database/supabase.service';
import { Result } from '@tet/backend/utils/result.type';
import {
  BibliothequeFichier,
  BibliothequeFichierCreate,
} from '@tet/domain/collectivites';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import * as mime from 'mime-types';
import { bibliothequeFichierTable } from '../models/bibliotheque-fichier.table';
import { storageObjectTable } from '../models/storage-object.table';
import {
  CreateDocumentError,
  CreateDocumentErrorEnum,
} from './create-document.errors';

@Injectable()
export class CreateDocumentService {
  private readonly logger = new Logger(CreateDocumentService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly supabaseService: SupabaseService
  ) {}

  async getCollectiviteBucketId(
    collectiviteId: number
  ): Promise<
    Result<string, typeof CreateDocumentErrorEnum.COLLECTIVITE_BUCKET_NOT_FOUND>
  > {
    const buckets = await this.databaseService.db
      .select({ bucketId: collectiviteBucketTable.bucketId })
      .from(collectiviteBucketTable)
      .where(eq(collectiviteBucketTable.collectiviteId, collectiviteId));
    if (!buckets?.length) {
      return {
        success: false,
        error: CreateDocumentErrorEnum.COLLECTIVITE_BUCKET_NOT_FOUND,
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
    user?: AuthenticatedUser
  ): Promise<Result<BibliothequeFichier, CreateDocumentError>> {
    if (user) {
      const isAllowed = await this.permissionService.isAllowed(
        user,
        'collectivites.documents.create',
        ResourceType.COLLECTIVITE,
        document.collectiviteId,
        true
      );
      if (!isAllowed) {
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

    this.logger.log(
      `Uploading file ${localFilePath} with mime type ${mimeType} to bucket ${bucketId} with hash ${document.hash}`
    );

    const fileBuffer = await readFile(localFilePath);
    const saveResult = await this.supabaseService.saveInStorage({
      bucket: bucketId,
      path: document.hash,
      file: fileBuffer,
      mimeType,
    });
    if (!saveResult.success) {
      return saveResult;
    }

    return await this.createDocument(document, user);
  }

  async createDocument(
    document: BibliothequeFichierCreate,
    user?: AuthenticatedUser
  ): Promise<Result<BibliothequeFichier, CreateDocumentError>> {
    this.logger.log(
      `Création du document ${document.filename} pour la collectivité ${document.collectiviteId}`
    );

    if (user) {
      const isAllowed = await this.permissionService.isAllowed(
        user,
        'collectivites.documents.create',
        ResourceType.COLLECTIVITE,
        document.collectiviteId,
        true
      );
      if (!isAllowed) {
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
        .returning();

      return {
        success: true,
        data: insertedDocument,
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la création du document ${
          document.filename
        } : ${getErrorMessage(error)}`
      );
      return {
        success: false,
        error: 'CREATE_DOCUMENT_ERROR',
      };
    }
  }
}
