import { failure, success } from '@tet/backend/utils/result.type';
import { Readable } from 'node:stream';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SNBC3_BUCKET,
  SNBC3_METHODOLOGIE_PATH,
  Snbc3ImportedRelease,
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

describe('Snbc3ReleaseStorageService.hasUnfinishedImport', () => {
  // métadonnées de `pending-release.json` ; celles du manifeste sont simulées
  // par `getImportedRelease`
  const where = vi.fn();
  const service = new Snbc3ReleaseStorageService(
    {} as never,
    { db: { select: () => ({ from: () => ({ where }) }) } } as never,
    {} as never
  );
  const release = { commit: 'abc123', version: 'V2.2' };

  const withReleases = (
    imported: Snbc3ImportedRelease | null,
    pending: Snbc3ImportedRelease | null
  ) => {
    vi.spyOn(service, 'getImportedRelease').mockResolvedValue(imported);
    where.mockResolvedValue(pending ? [{ userMetadata: pending }] : []);
  };

  it.each([
    ['aucun import commencé', null, null, false],
    ['dernier import complet allé au bout', release, release, false],
    ['manifeste antérieur au suivi des imports', release, null, false],
    ['premier import en cours', null, release, true],
    [
      'import d’une autre version en cours ou en échec',
      release,
      { ...release, version: 'V2.3' },
      true,
    ],
    [
      'import d’un autre commit en cours ou en échec',
      release,
      { ...release, commit: 'def456' },
      true,
    ],
    [
      'import marqué allé au bout',
      { ...release, importId: 'import-1' },
      { ...release, importId: 'import-1' },
      false,
    ],
    [
      'réimport de la release du manifeste en cours ou en échec',
      { ...release, importId: 'import-1' },
      { ...release, importId: 'import-2' },
      true,
    ],
    [
      'premier import marqué, manifeste antérieur au marqueur',
      release,
      { ...release, importId: 'import-2' },
      true,
    ],
  ])('%s', async (_, imported, pending, attendu) => {
    withReleases(imported, pending);
    expect(await service.hasUnfinishedImport()).toBe(attendu);
  });
});
