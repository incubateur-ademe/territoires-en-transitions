import { DocumentStorageErrorEnum } from '@tet/backend/utils/supabase/document-storage.errors';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { Readable, Writable } from 'node:stream';
import { describe, expect, test, vi } from 'vitest';
import { type ArchiveFolderArborescence } from './archive-arborescence.types';
import { ArchiveAssemblyErrorEnum } from './archive-assembly.errors';
import { ArchiveAssemblyService } from './archive-assembly.service';

const toArborescence = (
  filenames: string[] = ['deliberation.pdf']
): ArchiveFolderArborescence => ({
  files: filenames.map((filename, index) => ({
    folderSegments: [],
    filename,
    bucketId: 'collectivite-1',
    hash: String(index).repeat(64),
    filesize: 4,
  })),
  linkFolders: [],
  skippedFiles: [],
});

const toDocumentStorage = (
  delaysMs: number[] = [0]
): DocumentStorageService => {
  let callCount = 0;
  return {
    getDocumentStream: async () => {
      const delay = delaysMs[callCount++] ?? 0;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return success(Readable.from(['abcd']));
    },
  } as unknown as DocumentStorageService;
};

const toCollectingDestination = (): Writable & { collected: Buffer[] } => {
  const collected: Buffer[] = [];
  const destination = new Writable({
    write(chunk, _encoding, callback) {
      collected.push(Buffer.from(chunk));
      callback();
    },
  });
  return Object.assign(destination, { collected });
};

const toFailingDestination = (): Writable =>
  new Writable({
    write(_chunk, _encoding, callback) {
      callback(new Error('destination unavailable'));
    },
  });

describe('ArchiveAssemblyService.assembleZipToStorage', () => {
  test('dépose l archive assemblée sous le bucket et la clé demandés', async () => {
    const storeDocument = vi.fn().mockResolvedValue(success(undefined));
    const service = new ArchiveAssemblyService({
      getDocumentStream: async () => success(Readable.from(['abcd'])),
      storeDocument,
    } as unknown as DocumentStorageService);

    const result = await service.assembleZipToStorage({
      arborescence: toArborescence(),
      bucketId: 'preuves-archives',
      key: 'archive-1.zip',
    });

    expect(result).toEqual(success({ totalFiles: 1 }));
    expect(storeDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        bucketId: 'preuves-archives',
        key: 'archive-1.zip',
        })
    );
  });

  test('rend un échec quand le dépôt échoue', async () => {
    const service = new ArchiveAssemblyService({
      getDocumentStream: async () => success(Readable.from(['abcd'])),
      storeDocument: async () =>
        failure(
          DocumentStorageErrorEnum.WRITE_DOCUMENT_ERROR,
          new Error('stockage indisponible')
        ),
    } as unknown as DocumentStorageService);

    const result = await service.assembleZipToStorage({
      arborescence: toArborescence(),
      bucketId: 'preuves-archives',
      key: 'archive-1.zip',
    });

    expect(result).toMatchObject({
      success: false,
      error: ArchiveAssemblyErrorEnum.ARCHIVE_ASSEMBLY_FAILED,
    });
  });
});

describe('ArchiveAssemblyService.assembleZip', () => {
  test('écrit une archive dans la destination fournie', async () => {
    const service = new ArchiveAssemblyService(toDocumentStorage());
    const destination = toCollectingDestination();

    const result = await service.assembleZip({
      arborescence: toArborescence(),
      destination,
    });

    expect(result).toEqual(success({ totalFiles: 1 }));
    expect(Buffer.concat(destination.collected).subarray(0, 2)).toEqual(
      Buffer.from('PK')
    );
  });

  test("rend un échec quand la destination refuse d'écrire pendant les téléchargements", async () => {
    const service = new ArchiveAssemblyService(toDocumentStorage([0, 200]));

    const result = await service.assembleZip({
      arborescence: toArborescence(['rapide.pdf', 'lent.pdf']),
      destination: toFailingDestination(),
    });

    expect(result).toMatchObject({
      success: false,
      error: ArchiveAssemblyErrorEnum.ARCHIVE_ASSEMBLY_FAILED,
    });
  });
});
