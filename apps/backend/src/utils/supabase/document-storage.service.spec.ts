import { describe, expect, it, vi } from 'vitest';
import { DocumentStorageService } from './document-storage.service';

const SIGNED_URL = 'https://storage.test/object/sign/bucket/key.zip?token=abc';

function buildService(): DocumentStorageService {
  const createSignedUrl = vi
    .fn()
    .mockResolvedValue({ data: { signedUrl: SIGNED_URL }, error: null });
  return new DocumentStorageService({
    client: { storage: { from: () => ({ createSignedUrl }) } },
  } as never);
}

describe('DocumentStorageService.createSignedDownloadUrl', () => {
  it('encode le nom de téléchargement pour garder « & », « # » et « + »', async () => {
    const result = await buildService().createSignedDownloadUrl({
      bucketId: 'bucket',
      key: 'key.zip',
      expiresInSeconds: 60,
      downloadFilename: 'documents_eci_Terres & Mers #1+.zip',
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.signedUrl.startsWith(`${SIGNED_URL}&download=`)).toBe(
      true
    );
    expect(new URL(result.data.signedUrl).searchParams.get('download')).toBe(
      'documents_eci_Terres & Mers #1+.zip'
    );
  });

  it("laisse l'URL signée intacte sans nom de téléchargement", async () => {
    const result = await buildService().createSignedDownloadUrl({
      bucketId: 'bucket',
      key: 'key.zip',
      expiresInSeconds: 60,
    });

    expect(result).toEqual({ success: true, data: { signedUrl: SIGNED_URL } });
  });
});
