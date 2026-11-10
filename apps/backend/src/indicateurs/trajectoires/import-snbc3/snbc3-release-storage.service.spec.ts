import { failure, success } from '@tet/backend/utils/result.type';
import { Readable } from 'node:stream';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SNBC3_BUCKET,
  SNBC3_METHODOLOGIE_PATH,
  Snbc3ReleaseStorageService,
} from './snbc3-release-storage.service';

describe('Snbc3ReleaseStorageService.getMethodologie', () => {
  // ligne de `storage.objects` renvoyée par la requête Drizzle
  const where = vi.fn();
  const db = {
    select: () => ({ from: () => ({ where }) }),
  };
  const documentStorageService = { getDocumentStream: vi.fn() };
  const service = new Snbc3ReleaseStorageService(
    {} as never,
    { db } as never,
    documentStorageService as never
  );
  const stream = Readable.from(['%PDF']);

  beforeEach(() => {
    vi.clearAllMocks();
    documentStorageService.getDocumentStream.mockResolvedValue(success(stream));
  });

  it("renvoie null avant le premier import qui l'a stockée", async () => {
    where.mockResolvedValue([]);

    expect(await service.getMethodologie()).toEqual(success(null));
    expect(documentStorageService.getDocumentStream).not.toHaveBeenCalled();
  });

  it("reprend le nom d'origine stocké dans les métadonnées", async () => {
    where.mockResolvedValue([
      { userMetadata: { name: 'Méthodologie SNBC 3.pdf' } },
    ]);

    expect(await service.getMethodologie()).toEqual(
      success({ stream, fileName: 'Méthodologie SNBC 3.pdf' })
    );
    expect(documentStorageService.getDocumentStream).toHaveBeenCalledWith({
      bucketId: SNBC3_BUCKET,
      key: SNBC3_METHODOLOGIE_PATH,
    });
  });

  it('se rabat sur le chemin du bucket sans nom dans les métadonnées', async () => {
    where.mockResolvedValue([{ userMetadata: null }]);

    expect(await service.getMethodologie()).toEqual(
      success({ stream, fileName: SNBC3_METHODOLOGIE_PATH })
    );
  });

  it('signale un échec de lecture du PDF', async () => {
    where.mockResolvedValue([{ userMetadata: { name: 'methodo.pdf' } }]);
    documentStorageService.getDocumentStream.mockResolvedValue(
      failure('READ_DOCUMENT_ERROR')
    );

    expect(await service.getMethodologie()).toEqual(
      failure('READ_DOCUMENT_ERROR')
    );
  });
});
