import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { DocumentStorageErrorEnum } from '@tet/backend/utils/supabase/document-storage.errors';
import { type DocumentStorageError } from '@tet/backend/utils/supabase/document-storage.errors';
import { toDocumentHash } from '@tet/domain/collectivites';
import { describe, expect, it, vi, type Mock } from 'vitest';
import { type FichierInBibliotheque } from './create-upload-token.repository';
import { CreateUploadTokenService } from './create-upload-token.service';

const HASH = toDocumentHash(
  'ec07d0538e44a333b23b936c9a4ba37fbd211c6272e632d2173b6abe102a0482'
);

const user: AuthenticatedUser = { id: 'user-id' } as AuthenticatedUser;

type SignedUploadResult = Result<
  { token: string; path: string },
  DocumentStorageError
>;

type ServiceUnderTest = {
  service: CreateUploadTokenService;
  documentStorage: { createSignedUpload: Mock };
};

function buildService({
  isAllowed = true,
  hasBucket = true,
  fichier,
  signedUploadResult = success({
    token: 'jeton-signe',
    path: HASH,
  }),
}: {
  isAllowed?: boolean;
  hasBucket?: boolean;
  fichier?: FichierInBibliotheque;
  signedUploadResult?: SignedUploadResult;
} = {}): ServiceUnderTest {
  const permissions = {
    isAllowed: vi
      .fn()
      .mockResolvedValue(
        isAllowed
          ? { success: true, data: undefined }
          : { success: false, error: 'UNAUTHORIZED' }
      ),
  };

  const repository = {
    findFichierByHash: vi.fn().mockResolvedValue(fichier),
  };

  const collectiviteBucket = {
    findBucketId: vi
      .fn()
      .mockResolvedValue(hasBucket ? 'bucket-collectivite-1' : undefined),
  };

  const documentStorage = {
    createSignedUpload: vi.fn().mockResolvedValue(signedUploadResult),
  };

  const service = new CreateUploadTokenService(
    permissions as never,
    repository as never,
    collectiviteBucket as never,
    documentStorage as never
  );

  return { service, documentStorage };
}

describe('CreateUploadTokenService', () => {
  it('refuse un utilisateur sans droit de mutation sur la collectivite, sans signer', async () => {
    const { service, documentStorage } = buildService({ isAllowed: false });

    const result = await service.createUploadToken(
      { collectiviteId: 1, hash: HASH },
      { user }
    );

    expect(result).toEqual({ success: false, error: 'UNAUTHORIZED' });
    expect(documentStorage.createSignedUpload).not.toHaveBeenCalled();
  });

  it('rend COLLECTIVITE_BUCKET_NOT_FOUND quand la collectivite na pas de bucket', async () => {
    const { service, documentStorage } = buildService({ hasBucket: false });

    const result = await service.createUploadToken(
      { collectiviteId: 1, hash: HASH },
      { user }
    );

    expect(result).toEqual({
      success: false,
      error: 'COLLECTIVITE_BUCKET_NOT_FOUND',
    });
    expect(documentStorage.createSignedUpload).not.toHaveBeenCalled();
  });

  it('rend alreadyInBibliotheque sans signer quand le document a deja sa ligne', async () => {
    const { service, documentStorage } = buildService({
      fichier: { id: 42, filename: 'rapport.pdf' },
    });

    const result = await service.createUploadToken(
      { collectiviteId: 1, hash: HASH },
      { user }
    );

    expect(result).toEqual({
      success: true,
      data: {
        kind: 'alreadyInBibliotheque',
        fichierId: 42,
        filename: 'rapport.pdf',
      },
    });
    expect(documentStorage.createSignedUpload).not.toHaveBeenCalled();
  });

  it('signe le hash dans le bucket resolu cote serveur', async () => {
    const { service, documentStorage } = buildService();

    const result = await service.createUploadToken(
      { collectiviteId: 1, hash: HASH },
      { user }
    );

    expect(result).toEqual({
      success: true,
      data: {
        kind: 'readyToUpload',
        token: 'jeton-signe',
        bucketId: 'bucket-collectivite-1',
        path: HASH,
      },
    });
    expect(documentStorage.createSignedUpload).toHaveBeenCalledWith({
      bucketId: 'bucket-collectivite-1',
      key: HASH,
    });
  });

  it('remonte SIGN_UPLOAD_ERROR quand la signature echoue', async () => {
    const { service } = buildService({
      signedUploadResult: failure(
        DocumentStorageErrorEnum.WRITE_DOCUMENT_ERROR
      ),
    });

    const result = await service.createUploadToken(
      { collectiviteId: 1, hash: HASH },
      { user }
    );

    expect(result).toMatchObject({
      success: false,
      error: 'SIGN_UPLOAD_ERROR',
    });
  });
});
