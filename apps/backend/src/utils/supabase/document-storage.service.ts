import { Injectable, Logger } from '@nestjs/common';
import SupabaseService from '@tet/backend/utils/database/supabase.service';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { type ReadableStream as WebReadableStream } from 'node:stream/web';
import {
  DocumentStorageErrorEnum,
  type DocumentStorageError,
} from './document-storage.errors';

// URL signée consommée immédiatement par `fetch()`, ne sort jamais du process.
const STREAM_FETCH_TTL_SECONDS = 60;

export type DocumentLocation = {
  bucketId: string;
  key: string;
};

export type StoreDocumentInput = DocumentLocation & {
  contentType: string;
} & ({ sourceFilePath: string } | { content: Buffer });

export type CreateDocumentSignedUrlInput = DocumentLocation & {
  expiresInSeconds: number;
};

@Injectable()
export class DocumentStorageService {
  private readonly logger = new Logger(DocumentStorageService.name);

  constructor(private readonly supabase: SupabaseService) {}

  /** `fetch` authentifié plutôt que `storage.download()`, qui bufferise l'objet entier en mémoire. */
  async getDocumentStream(
    input: DocumentLocation
  ): Promise<Result<Readable, DocumentStorageError>> {
    const { bucketId, key } = input;
    try {
      const { data, error } = await this.supabase.client.storage
        .from(bucketId)
        .createSignedUrl(key, STREAM_FETCH_TTL_SECONDS);

      if (error || !data) {
        this.logger.error(
          `Signed URL introuvable pour ${bucketId}/${key}: ${
            error?.message ?? 'objet absent'
          }`
        );
        return failure(DocumentStorageErrorEnum.READ_DOCUMENT_ERROR);
      }

      const response = await fetch(data.signedUrl);
      if (!response.ok || !response.body) {
        this.logger.error(
          `Téléchargement échoué pour ${bucketId}/${key}: HTTP ${response.status}`
        );
        return failure(DocumentStorageErrorEnum.READ_DOCUMENT_ERROR);
      }

      // `fetch` renvoie le `ReadableStream` de lib.dom ; `Readable.fromWeb`
      // attend celui de node:stream/web — structurellement identiques, distincts
      // au niveau des types. Conversion explicite à la frontière externe.
      return success(
        Readable.fromWeb(response.body as WebReadableStream<Uint8Array>)
      );
    } catch (error) {
      this.logger.error(
        `Erreur de lecture du document ${bucketId}/${key}: ${getErrorMessage(
          error
        )}`
      );
      return failure(
        DocumentStorageErrorEnum.READ_DOCUMENT_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }

  async storeDocument(
    input: StoreDocumentInput
  ): Promise<Result<{ key: string }, DocumentStorageError>> {
    const { bucketId, key, contentType } = input;
    try {
      const file =
        'content' in input
          ? input.content
          : createReadStream(input.sourceFilePath);
      const uploadResult = await this.supabase.saveInStorage({
        bucket: bucketId,
        path: key,
        file,
        mimeType: contentType,
      });

      if (!uploadResult.success) {
        this.logger.error(
          `Upload du document ${bucketId}/${key} échoué: ${uploadResult.error}`
        );
        return failure(DocumentStorageErrorEnum.WRITE_DOCUMENT_ERROR);
      }

      return success({ key: uploadResult.data.path });
    } catch (error) {
      this.logger.error(
        `Erreur d'upload du document ${bucketId}/${key}: ${getErrorMessage(
          error
        )}`
      );
      return failure(
        DocumentStorageErrorEnum.WRITE_DOCUMENT_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }

  async createDocumentSignedUrl(
    input: CreateDocumentSignedUrlInput
  ): Promise<Result<{ signedUrl: string }, DocumentStorageError>> {
    const { bucketId, key, expiresInSeconds } = input;
    try {
      const { data, error } = await this.supabase.client.storage
        .from(bucketId)
        .createSignedUrl(key, expiresInSeconds);

      if (error || !data) {
        this.logger.error(
          `Signed URL introuvable pour ${bucketId}/${key}: ${
            error?.message ?? 'objet absent'
          }`
        );
        return failure(DocumentStorageErrorEnum.READ_DOCUMENT_ERROR);
      }

      return success({ signedUrl: data.signedUrl });
    } catch (error) {
      this.logger.error(
        `Erreur de génération de signed URL pour ${bucketId}/${key}: ${getErrorMessage(
          error
        )}`
      );
      return failure(
        DocumentStorageErrorEnum.READ_DOCUMENT_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }

  async downloadDocument(
    input: DocumentLocation
  ): Promise<Result<{ buffer: Buffer; mimeType: string }, DocumentStorageError>> {
    const { bucketId, key } = input;
    try {
      const { data, error } = await this.supabase.client.storage
        .from(bucketId)
        .download(key);

      if (error || !data) {
        this.logger.error(
          `Téléchargement échoué pour ${bucketId}/${key}: ${
            error?.message ?? 'objet absent'
          }`
        );
        return failure(DocumentStorageErrorEnum.READ_DOCUMENT_ERROR);
      }

      return success({
        buffer: Buffer.from(await data.arrayBuffer()),
        mimeType: data.type,
      });
    } catch (error) {
      this.logger.error(
        `Erreur de téléchargement du document ${bucketId}/${key}: ${getErrorMessage(
          error
        )}`
      );
      return failure(
        DocumentStorageErrorEnum.READ_DOCUMENT_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }

  async removeDocument(
    input: DocumentLocation
  ): Promise<Result<undefined, DocumentStorageError>> {
    const { bucketId, key } = input;
    try {
      const { error } = await this.supabase.client.storage
        .from(bucketId)
        .remove([key]);

      if (error) {
        this.logger.error(
          `Suppression échouée pour ${bucketId}/${key}: ${error.message}`
        );
        return failure(DocumentStorageErrorEnum.DELETE_DOCUMENT_ERROR);
      }

      return success(undefined);
    } catch (error) {
      this.logger.error(
        `Erreur de suppression du document ${bucketId}/${key}: ${getErrorMessage(
          error
        )}`
      );
      return failure(
        DocumentStorageErrorEnum.DELETE_DOCUMENT_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }
}
