import { Mock, describe, expect, it, vi } from 'vitest';
import { StoreDocumentErrorEnum } from './store-document.errors';
import { StoreDocumentService } from './store-document.service';

const UNREADABLE_FILE_PATH = '/tmp/tet-rapport-inexistant-4f2a9c.pptx';

type ServiceUnderTest = {
  service: StoreDocumentService;
  saveInStorage: Mock;
};

function buildServiceWithBucket(
  bucketId: string | undefined
): ServiceUnderTest {
  const permissionService = { isAllowed: vi.fn() };
  const collectiviteBucketRepository = {
    findBucketId: vi.fn().mockResolvedValue(bucketId),
  };
  const saveInStorage = vi.fn();

  const service = new StoreDocumentService(
    {} as never,
    permissionService as never,
    { saveInStorage } as never,
    {} as never,
    collectiviteBucketRepository as never
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

  it("rend COLLECTIVITE_BUCKET_NOT_FOUND sans déposer quand la collectivité n'a pas de bucket", async () => {
    const { service, saveInStorage } = buildServiceWithBucket(undefined);

    const result = await service.uploadLocalFile(
      { collectiviteId: 1, filename: 'rapport.pptx', confidentiel: false },
      UNREADABLE_FILE_PATH
    );

    expect(result).toEqual({
      success: false,
      error: StoreDocumentErrorEnum.COLLECTIVITE_BUCKET_NOT_FOUND,
    });
    expect(saveInStorage).not.toHaveBeenCalled();
  });
});
