import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { DocumentStorageErrorEnum } from '@tet/backend/utils/supabase/document-storage.errors';
import { type DocumentStorageError } from '@tet/backend/utils/supabase/document-storage.errors';
import {
  BibliothequeFichier,
  toDocumentHash,
  UploadDecisionKindEnum,
} from '@tet/domain/collectivites';
import { describe, expect, it, vi, type Mock } from 'vitest';
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
  storageObjectRepository: { existsInBucket: Mock };
};

function buildService({
  isAllowed = true,
  hasBucket = true,
  fichier,
  hasStorageObject = false,
  signedUploadResult = success({
    token: 'jeton-signe',
    path: HASH,
  }),
}: {
  isAllowed?: boolean;
  hasBucket?: boolean;
  fichier?: Pick<BibliothequeFichier, 'id' | 'filename'>;
  hasStorageObject?: boolean;
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

  const bibliothequeFichierRepository = {
    findByHash: vi.fn().mockResolvedValue(fichier),
  };

  const collectiviteBucket = {
    findBucketId: vi
      .fn()
      .mockResolvedValue(hasBucket ? 'bucket-collectivite-1' : undefined),
  };

  const documentStorage = {
    createSignedUpload: vi.fn().mockResolvedValue(signedUploadResult),
  };

  const storageObjectRepository = {
    existsInBucket: vi.fn().mockResolvedValue(hasStorageObject),
  };

  const service = new CreateUploadTokenService(
    permissions as never,
    bibliothequeFichierRepository as never,
    collectiviteBucket as never,
    documentStorage as never,
    storageObjectRepository as never
  );

  return { service, documentStorage, storageObjectRepository };
}

describe('CreateUploadTokenService', () => {
  it('refuse un utilisateur sans droit de mutation sur la collectivite, sans signer', async () => {
    const { service, documentStorage, storageObjectRepository } = buildService({
      isAllowed: false,
      hasStorageObject: true,
    });

    const result = await service.createUploadToken(
      { collectiviteId: 1, hash: HASH },
      { user }
    );

    expect(result).toEqual({ success: false, error: 'UNAUTHORIZED' });
    expect(documentStorage.createSignedUpload).not.toHaveBeenCalled();
    expect(storageObjectRepository.existsInBucket).not.toHaveBeenCalled();
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
        kind: UploadDecisionKindEnum.ALREADY_IN_BIBLIOTHEQUE,
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
        kind: UploadDecisionKindEnum.READY_TO_UPLOAD,
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

  it('réutilise un objet stocké sans entrée en bibliothèque, sans signer un nouvel envoi', async () => {
    const { service, documentStorage } = buildService({
      hasStorageObject: true,
      signedUploadResult: failure(
        DocumentStorageErrorEnum.WRITE_DOCUMENT_ERROR
      ),
    });

    const result = await service.createUploadToken(
      { collectiviteId: 1, hash: HASH },
      { user }
    );

    expect(result).toEqual({
      success: true,
      data: { kind: UploadDecisionKindEnum.ALREADY_IN_STORAGE },
    });
    expect(documentStorage.createSignedUpload).not.toHaveBeenCalled();
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
