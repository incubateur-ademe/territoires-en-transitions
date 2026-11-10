import { Injectable, Logger } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { StoreDocumentErrorEnum } from '@tet/backend/collectivites/documents/store-document/store-document.errors';
import ConfigurationService from '../config/configuration.service';
import { Result } from '../result.type';

type FileBody =
  | ArrayBuffer
  | ArrayBufferView
  | Blob
  | Buffer
  | File
  | FormData
  | NodeJS.ReadableStream
  | ReadableStream<Uint8Array>
  | URLSearchParams
  | string;

@Injectable()
export default class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);

  public readonly client: ReturnType<typeof createClient>;

  constructor(configService: ConfigurationService) {
    const supabaseUrl = configService.get('SUPABASE_URL');
    this.logger.log(`Initializing supabase service with url: ${supabaseUrl}`);
    this.client = createClient(
      supabaseUrl,
      configService.get('SUPABASE_SERVICE_ROLE_KEY')
    );
  }

  async saveInStorage(args: {
    bucket: string;
    path: string;
    file: FileBody;
    mimeType?: string;
  }): Promise<
    Result<
      {
        id: string;
        path: string;
        fullPath: string;
      },
      | typeof StoreDocumentErrorEnum.UPLOAD_STORAGE_ERROR
      | typeof StoreDocumentErrorEnum.FILE_TOO_LARGE
    >
  > {
    const { bucket, path, file, mimeType } = args;
    const { data, error } = await this.client.storage
      .from(bucket)
      .upload(path, file, {
        contentType: mimeType,
        upsert: true,
      });
    if (error) {
      this.logger.error(`Error saving file in storage: ${error.message}`);
      return {
        success: false,
        error: isFileTooLargeError(error)
          ? 'FILE_TOO_LARGE'
          : 'UPLOAD_STORAGE_ERROR',
      };
    }
    return {
      success: true,
      data: data,
    };
  }
}

// Supabase Storage renvoie 413 quand l'objet dépasse la limite de taille du projet ou du bucket.
function isFileTooLargeError(error: Error): boolean {
  return (
    ('statusCode' in error && String(error.statusCode) === '413') ||
    ('status' in error && error.status === 413)
  );
}
