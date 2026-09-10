import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { success } from '@tet/backend/utils/result.type';
import { Readable, Writable } from 'node:stream';
import { describe, expect, test } from 'vitest';
import { type ArchiveFolderArborescence } from './archive-arborescence.types';
import { ArchiveAssemblyErrorEnum } from './archive-assembly.errors';
import { BuildArchiveService } from './build-archive.service';

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

describe('BuildArchiveService.assembleZip', () => {
  test('écrit une archive dans la destination fournie', async () => {
    const service = new BuildArchiveService(toDocumentStorage());
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
    const service = new BuildArchiveService(toDocumentStorage([0, 200]));

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
