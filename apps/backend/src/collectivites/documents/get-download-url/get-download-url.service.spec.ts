import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success } from '@tet/backend/utils/result.type';
import { DocumentStorageErrorEnum } from '@tet/backend/utils/supabase/document-storage.errors';
import { toDocumentHash } from '@tet/domain/collectivites';
import { describe, expect, it, vi, type Mock } from 'vitest';
import { GetDownloadUrlService } from './get-download-url.service';
import { type DocumentToDownload } from './get-download-url.repository';

const HASH = toDocumentHash(
  'ec07d0538e44a333b23b936c9a4ba37fbd211c6272e632d2173b6abe102a0482'
);

const FICHIER_ID = 42;

const user: AuthenticatedUser = { id: 'user-id' } as AuthenticatedUser;

type DocumentsAccess = 'unauthorized' | 'public' | 'confidential';

type ServiceUnderTest = {
  service: GetDownloadUrlService;
  collectiviteDocumentsAccess: { checkUserCanReadDocuments: Mock };
  repository: { findDocument: Mock };
  documentStorage: { createSignedDownloadUrl: Mock };
};

function buildService({
  access = 'public',
  document = {
    hash: HASH,
    filename: 'rapport.pdf',
    confidentiel: false,
  },
  documentExists = true,
  hasBucket = true,
  signatureFails = false,
}: {
  access?: DocumentsAccess;
  document?: DocumentToDownload;
  documentExists?: boolean;
  hasBucket?: boolean;
  signatureFails?: boolean;
} = {}): ServiceUnderTest {
  const accessResult =
    access === 'unauthorized'
      ? failure('UNAUTHORIZED')
      : success({ canReadConfidentiel: access === 'confidential' });

  const collectiviteDocumentsAccess = {
    checkUserCanReadDocuments: vi.fn().mockResolvedValue(accessResult),
  };

  const repository = {
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
    collectiviteDocumentsAccess as never,
    repository as never,
    collectiviteBucket as never,
    documentStorage as never
  );

  return { service, collectiviteDocumentsAccess, repository, documentStorage };
}

describe('GetDownloadUrlService', () => {
  it('controle les droits sur la collectivite du document demande, dans la transaction recue', async () => {
    const { service, collectiviteDocumentsAccess } = buildService();
    const tx = {} as never;

    await service.getDownloadUrl(
      { collectiviteId: 1, fichierId: FICHIER_ID },
      { user, tx }
    );

    expect(
      collectiviteDocumentsAccess.checkUserCanReadDocuments
    ).toHaveBeenCalledWith({ collectiviteId: 1 }, { user, tx });
  });

  it('refuse un compte sans acces aux documents de la collectivite sans consulter le document', async () => {
    const { service, repository, documentStorage } = buildService({
      access: 'unauthorized',
    });

    const result = await service.getDownloadUrl(
      { collectiviteId: 1, fichierId: FICHIER_ID },
      { user }
    );

    expect(result).toEqual({ success: false, error: 'UNAUTHORIZED' });
    expect(repository.findDocument).not.toHaveBeenCalled();
    expect(documentStorage.createSignedDownloadUrl).not.toHaveBeenCalled();
  });

  it("refuse un document confidentiel sans reveler qu'il existe", async () => {
    const { service, documentStorage } = buildService({
      document: { hash: HASH, filename: 'rapport.pdf', confidentiel: true },
    });

    const result = await service.getDownloadUrl(
      { collectiviteId: 1, fichierId: FICHIER_ID },
      { user }
    );

    expect(result).toEqual({ success: false, error: 'DOCUMENT_NOT_FOUND' });
    expect(documentStorage.createSignedDownloadUrl).not.toHaveBeenCalled();
  });

  it('signe un document confidentiel pour un compte qui a le droit confidentiel', async () => {
    const { service } = buildService({
      access: 'confidential',
      document: { hash: HASH, filename: 'rapport.pdf', confidentiel: true },
    });

    const result = await service.getDownloadUrl(
      { collectiviteId: 1, fichierId: FICHIER_ID },
      { user }
    );

    expect(result).toEqual({
      success: true,
      data: { signedUrl: 'https://signe.example/doc', filename: 'rapport.pdf' },
    });
  });

  it('signe un document non confidentiel pour un compte qui a acces aux documents', async () => {
    const { service } = buildService();

    const result = await service.getDownloadUrl(
      { collectiviteId: 1, fichierId: FICHIER_ID },
      { user }
    );

    expect(result).toEqual({
      success: true,
      data: { signedUrl: 'https://signe.example/doc', filename: 'rapport.pdf' },
    });
  });

  it("rend DOCUMENT_NOT_FOUND quand l'identifiant ne designe aucun document de la collectivite", async () => {
    const { service } = buildService({ documentExists: false });

    const result = await service.getDownloadUrl(
      { collectiviteId: 1, fichierId: FICHIER_ID },
      { user }
    );

    expect(result).toEqual({ success: false, error: 'DOCUMENT_NOT_FOUND' });
  });

  it("rend COLLECTIVITE_BUCKET_NOT_FOUND quand la collectivite n'a pas de bucket", async () => {
    const { service, documentStorage } = buildService({ hasBucket: false });

    const result = await service.getDownloadUrl(
      { collectiviteId: 1, fichierId: FICHIER_ID },
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
      { collectiviteId: 1, fichierId: FICHIER_ID },
      { user }
    );

    expect(result).toMatchObject({
      success: false,
      error: 'SIGN_DOWNLOAD_ERROR',
    });
  });
});
