import { Mock, describe, expect, it, vi } from 'vitest';
import { StoreDocumentService } from './store-document.service';

const UNREADABLE_FILE_PATH = '/tmp/tet-rapport-inexistant-4f2a9c.pptx';

type ServiceUnderTest = {
  service: StoreDocumentService;
  saveInStorage: Mock;
};

function buildServiceWithBucket(bucketId: string): ServiceUnderTest {
  const databaseService = {
    db: {
      select: () => ({
        from: () => ({
          where: () => [{ bucketId }],
        }),
      }),
    },
  };
  const permissionService = { isAllowed: vi.fn() };
  const saveInStorage = vi.fn();

  const service = new StoreDocumentService(
    databaseService as never,
    permissionService as never,
    { saveInStorage } as never
  );

  return { service, saveInStorage };
}

describe('StoreDocumentService.uploadLocalFile', () => {
  it('rend UPLOAD_STORAGE_ERROR sans lever quand le fichier local est illisible', async () => {
    const { service, saveInStorage } = buildServiceWithBucket(
      'bucket-collectivite-1'
    );

    const result = await service.uploadLocalFile(
      { collectiviteId: 1, filename: 'rapport.pptx', confidentiel: false },
      UNREADABLE_FILE_PATH
    );

    expect(result).toEqual({ success: false, error: 'UPLOAD_STORAGE_ERROR' });
    expect(saveInStorage).not.toHaveBeenCalled();
  });
});
