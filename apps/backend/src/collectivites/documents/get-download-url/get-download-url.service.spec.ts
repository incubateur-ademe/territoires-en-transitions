import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success } from '@tet/backend/utils/result.type';
import { DocumentStorageErrorEnum } from '@tet/backend/utils/supabase/document-storage.errors';
import { describe, expect, it, vi, type Mock } from 'vitest';
import { GetDownloadUrlService } from './get-download-url.service';
import { type DocumentToDownload } from './get-download-url.repository';

const HASH = 'ec07d0538e44a333b23b936c9a4ba37fbd211c6272e632d2173b6abe102a0482';

const user: AuthenticatedUser = { id: 'user-id' } as AuthenticatedUser;

const allowed = { success: true, data: undefined };
const denied = { success: false, error: 'UNAUTHORIZED' };

type ServiceUnderTest = {
  service: GetDownloadUrlService;
  repository: { findDocument: Mock };
  documentStorage: { createSignedDownloadUrl: Mock };
};

function buildService({
  isCollectivitePrivate = false,
  canRead = true,
  canReadConfidentiel = false,
  document = {
    hash: HASH,
    filename: 'rapport.pdf',
    confidentiel: false,
  },
  documentExists = true,
  hasBucket = true,
  signatureFails = false,
}: {
  isCollectivitePrivate?: boolean;
  canRead?: boolean;
  canReadConfidentiel?: boolean;
  document?: DocumentToDownload;
  documentExists?: boolean;
  hasBucket?: boolean;
  signatureFails?: boolean;
} = {}): ServiceUnderTest {
  const permissionService = {
    isAllowed: vi
      .fn()
      .mockImplementation((_user, operation) =>
        Promise.resolve(
          operation === 'collectivites.documents.read_confidentiel'
            ? canReadConfidentiel
              ? allowed
              : denied
            : canRead
            ? allowed
            : denied
        )
      ),
  };

  const repository = {
    isCollectiviteAccesRestreint: vi
      .fn()
      .mockResolvedValue(isCollectivitePrivate),
    findDocument: vi
      .fn()
      .mockResolvedValue(documentExists ? document : undefined),
  };

  const collectiviteBucket = {
    findBucketId: vi
      .fn()
      .mockResolvedValue(hasBucket ? 'bucket-collectivite-1' : undefined),
  };

  const documentStorage = {
    createSignedDownloadUrl: vi
      .fn()
      .mockResolvedValue(
        signatureFails
          ? failure(DocumentStorageErrorEnum.READ_DOCUMENT_ERROR)
          : success({ signedUrl: 'https://signe.example/doc' })
      ),
  };

  const service = new GetDownloadUrlService(
    permissionService as never,
    repository as never,
    collectiviteBucket as never,
    documentStorage as never
  );

  return { service, repository, documentStorage };
}

describe('GetDownloadUrlService', () => {
  it("refuse un document non confidentiel d'une collectivite en acces restreint a un compte sans droit confidentiel", async () => {
    const { service, documentStorage } = buildService({
      isCollectivitePrivate: true,
      canRead: true,
      canReadConfidentiel: false,
      document: { hash: HASH, filename: 'rapport.pdf', confidentiel: false },
    });

    const result = await service.getDownloadUrl(
      { collectiviteId: 1, hash: HASH },
      { user }
    );

    expect(result).toEqual({ success: false, error: 'UNAUTHORIZED' });
    expect(documentStorage.createSignedDownloadUrl).not.toHaveBeenCalled();
  });

  it("signe un document non confidentiel d'une collectivite en acces restreint pour un compte qui a le droit confidentiel", async () => {
    const { service } = buildService({
      isCollectivitePrivate: true,
      canReadConfidentiel: true,
    });

    const result = await service.getDownloadUrl(
      { collectiviteId: 1, hash: HASH },
      { user }
    );

    expect(result).toEqual({
      success: true,
      data: { signedUrl: 'https://signe.example/doc', filename: 'rapport.pdf' },
    });
  });

  it("refuse un document confidentiel sans reveler qu'il existe", async () => {
    const { service, documentStorage } = buildService({
      document: { hash: HASH, filename: 'rapport.pdf', confidentiel: true },
    });

    const result = await service.getDownloadUrl(
      { collectiviteId: 1, hash: HASH },
      { user }
    );

    expect(result).toEqual({ success: false, error: 'DOCUMENT_NOT_FOUND' });
    expect(documentStorage.createSignedDownloadUrl).not.toHaveBeenCalled();
  });

  it('signe un document confidentiel pour un compte qui a le droit confidentiel', async () => {
    const { service } = buildService({
      canReadConfidentiel: true,
      document: { hash: HASH, filename: 'rapport.pdf', confidentiel: true },
    });

    const result = await service.getDownloadUrl(
      { collectiviteId: 1, hash: HASH },
      { user }
    );

    expect(result.success).toBe(true);
  });

  it('signe un document non confidentiel dune collectivite publique', async () => {
    const { service } = buildService();

    const result = await service.getDownloadUrl(
      { collectiviteId: 1, hash: HASH },
      { user }
    );

    expect(result).toEqual({
      success: true,
      data: { signedUrl: 'https://signe.example/doc', filename: 'rapport.pdf' },
    });
  });

  it('refuse un compte sans aucun droit de lecture sans consulter le document', async () => {
    const { service, repository, documentStorage } = buildService({
      canRead: false,
    });

    const result = await service.getDownloadUrl(
      { collectiviteId: 1, hash: HASH },
      { user }
    );

    expect(result).toEqual({ success: false, error: 'UNAUTHORIZED' });
    expect(repository.findDocument).not.toHaveBeenCalled();
    expect(documentStorage.createSignedDownloadUrl).not.toHaveBeenCalled();
  });

  it('rend DOCUMENT_NOT_FOUND quand le hash ne designe aucun document de la collectivite', async () => {
    const { service } = buildService({ documentExists: false });

    const result = await service.getDownloadUrl(
      { collectiviteId: 1, hash: HASH },
      { user }
    );

    expect(result).toEqual({ success: false, error: 'DOCUMENT_NOT_FOUND' });
  });

  it("rend COLLECTIVITE_BUCKET_NOT_FOUND quand la collectivite n'a pas de bucket", async () => {
    const { service, documentStorage } = buildService({ hasBucket: false });

    const result = await service.getDownloadUrl(
      { collectiviteId: 1, hash: HASH },
      { user }
    );

    expect(result).toEqual({
      success: false,
      error: 'COLLECTIVITE_BUCKET_NOT_FOUND',
    });
    expect(documentStorage.createSignedDownloadUrl).not.toHaveBeenCalled();
  });

  it('remonte SIGN_DOWNLOAD_ERROR quand la signature echoue', async () => {
    const { service } = buildService({ signatureFails: true });

    const result = await service.getDownloadUrl(
      { collectiviteId: 1, hash: HASH },
      { user }
    );

    expect(result).toMatchObject({
      success: false,
      error: 'SIGN_DOWNLOAD_ERROR',
    });
  });

  it('traite une collectivite inconnue comme un acces restreint', async () => {
    const { service, documentStorage } = buildService({
      isCollectivitePrivate: true,
      canReadConfidentiel: false,
    });

    const result = await service.getDownloadUrl(
      { collectiviteId: 404, hash: HASH },
      { user }
    );

    expect(result).toEqual({ success: false, error: 'UNAUTHORIZED' });
    expect(documentStorage.createSignedDownloadUrl).not.toHaveBeenCalled();
  });
});
