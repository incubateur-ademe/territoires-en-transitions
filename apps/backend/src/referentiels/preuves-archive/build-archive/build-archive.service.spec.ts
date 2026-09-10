import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { success } from '@tet/backend/utils/result.type';
import { Readable, Writable } from 'node:stream';
import { describe, expect, test } from 'vitest';
import { type ArchiveFolderArborescence } from './archive-arborescence';
import { ARCHIVE_ASSEMBLY_FAILED } from './archive-assembly.errors';
import { BuildArchiveService } from './build-archive.service';

const toArborescence = (): ArchiveFolderArborescence => ({
  files: [
    {
      folderSegments: [],
      filename: 'deliberation.pdf',
      bucketId: 'collectivite-1',
      hash: 'a'.repeat(64),
      filesize: 4,
    },
  ],
  linkFolders: [],
  skippedFiles: [],
});

const toDocumentStorage = (): DocumentStorageService =>
  ({
    getDocumentStream: async () => success(Readable.from(['abcd'])),
  } as unknown as DocumentStorageService);

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
      callback(new Error('destination indisponible'));
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

  test("rend un échec quand la destination refuse l'écriture", async () => {
    const service = new BuildArchiveService(toDocumentStorage());

    const result = await service.assembleZip({
      arborescence: toArborescence(),
      destination: toFailingDestination(),
    });

    expect(result.success).toBe(false);
    expect(result.success === false && result.error).toBe(
      ARCHIVE_ASSEMBLY_FAILED
    );
  });
});
