import { Injectable, Logger } from '@nestjs/common';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import archiver, { type Archiver } from 'archiver';
import { createWriteStream } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { type Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { type ArchiveFolderArborescence } from './archive-arborescence.types';
import {
  ArchiveAssemblyErrorEnum,
  type ArchiveAssemblyError,
} from './archive-assembly.errors';
import {
  ARCHIVE_ZIP_CONTENT_TYPE,
  PREUVES_ARCHIVES_BUCKET,
} from '../preuves-archive.constants';
import {
  PreuvesArchiveErrorEnum,
  type PreuvesArchiveError,
} from '../preuves-archive.errors';
import { mapWithConcurrency } from '@tet/backend/utils/map-with-concurrency';
import { buildArchiveManifests } from './build-archive-manifests';
import {
  prepareArchiveEntries,
  type PreparedFileEntry,
} from './prepare-archive-entries';

const DOWNLOAD_CONCURRENCY = 8;

const toSettledError = (
  promise: Promise<unknown>
): Promise<Error | undefined> =>
  promise.then(
    () => undefined,
    (error: unknown) =>
      error instanceof Error ? error : new Error(getErrorMessage(error))
  );

export interface BuildAndUploadInput {
  archiveId: string;
  arborescence: ArchiveFolderArborescence;
  storagePath: string;
  onProgress?: (processedFiles: number) => void;
}

type DownloadOutcome =
  | { kind: 'appended' }
  | { kind: 'failed'; message: string };

export interface AssembleZipInput {
  arborescence: ArchiveFolderArborescence;
  destination: Writable;
  onProgress?: (processedFiles: number) => void;
}

@Injectable()
export class BuildArchiveService {
  private readonly logger = new Logger(BuildArchiveService.name);

  constructor(private readonly documentStorage: DocumentStorageService) {}

  async buildAndUpload(
    input: BuildAndUploadInput
  ): Promise<Result<{ totalFiles: number }, PreuvesArchiveError>> {
    const { archiveId, arborescence, storagePath, onProgress } = input;

    let tempDir: string | null = null;
    try {
      tempDir = await mkdtemp(join(tmpdir(), 'preuves-archive-'));
      const tempZipPath = join(tempDir, `${archiveId}.zip`);

      const assembleResult = await this.assembleZip({
        arborescence,
        destination: createWriteStream(tempZipPath),
        onProgress,
      });
      if (!assembleResult.success) {
        return failure(
          PreuvesArchiveErrorEnum.CREATE_ARCHIVE_ERROR,
          assembleResult.cause
        );
      }

      const uploadResult = await this.documentStorage.storeDocument({
        bucketId: PREUVES_ARCHIVES_BUCKET,
        key: storagePath,
        sourceFilePath: tempZipPath,
        contentType: ARCHIVE_ZIP_CONTENT_TYPE,
      });
      if (!uploadResult.success) {
        return failure(
          PreuvesArchiveErrorEnum.CREATE_ARCHIVE_ERROR,
          uploadResult.cause
        );
      }

      return success({ totalFiles: assembleResult.data.totalFiles });
    } catch (error) {
      this.logger.error(
        `Construction de l'archive ${archiveId} échouée: ${getErrorMessage(
          error
        )}`
      );
      return failure(
        PreuvesArchiveErrorEnum.CREATE_ARCHIVE_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    } finally {
      if (tempDir !== null) {
        await rm(tempDir, { recursive: true, force: true }).catch((error) =>
          this.logger.warn(
            `Nettoyage du dossier temporaire ${tempDir} échoué: ${getErrorMessage(
              error
            )}`
          )
        );
      }
    }
  }

  async assembleZip({
    arborescence,
    destination,
    onProgress,
  }: AssembleZipInput): Promise<
    Result<{ totalFiles: number }, ArchiveAssemblyError>
  > {
    const archive = archiver('zip', { store: true });
    const writeOutcome = toSettledError(pipeline(archive, destination));

    const preparedEntries = prepareArchiveEntries(arborescence.files);

    try {
      const outcomes = await mapWithConcurrency(
        preparedEntries,
        DOWNLOAD_CONCURRENCY,
        (entry) => this.downloadAndAppendEntry({ entry, archive }),
        (processed) => onProgress?.(processed)
      );
      const failedDownloads = outcomes.flatMap((outcome) =>
        outcome.kind === 'failed' ? [outcome.message] : []
      );

      buildArchiveManifests({ arborescence, failedDownloads }).forEach(
        (entry) => archive.append(entry.content, { name: entry.name })
      );

      const finalizeOutcome = toSettledError(archive.finalize());

      const writeError = await writeOutcome;
      if (writeError) {
        return this.toAssemblyFailure(writeError, archive);
      }

      const finalizeError = await finalizeOutcome;
      if (finalizeError) {
        return this.toAssemblyFailure(finalizeError, archive);
      }

      return success({ totalFiles: preparedEntries.length });
    } catch (error) {
      return this.toAssemblyFailure(
        error instanceof Error ? error : new Error(getErrorMessage(error)),
        archive
      );
    }
  }

  private toAssemblyFailure(
    error: Error,
    archive: Archiver
  ): Result<{ totalFiles: number }, ArchiveAssemblyError> {
    archive.abort();
    this.logger.error(`Assemblage de l'archive interrompu: ${error.message}`);
    return failure(ArchiveAssemblyErrorEnum.ARCHIVE_ASSEMBLY_FAILED, error);
  }

  private async downloadAndAppendEntry({
    entry,
    archive,
  }: {
    entry: PreparedFileEntry;
    archive: Archiver;
  }): Promise<DownloadOutcome> {
    const streamResult = await this.documentStorage.getDocumentStream({
      bucketId: entry.bucketId,
      key: entry.hash,
    });
    if (!streamResult.success) {
      return {
        kind: 'failed',
        message: `${entry.emplacement}/${entry.filename} (téléchargement échoué)`,
      };
    }
    archive.append(streamResult.data, { name: entry.entryPath });
    return { kind: 'appended' };
  }
}
