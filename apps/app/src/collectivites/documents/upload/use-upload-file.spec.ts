import { renderHook } from '@testing-library/react';
import {
  toDocumentHash,
  UploadDecisionKindEnum,
} from '@tet/domain/collectivites';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUploadFile } from './use-upload-file';

const { createUploadToken, createDocument, uploadToStorage } = vi.hoisted(
  () => ({
    createUploadToken: vi.fn(),
    createDocument: vi.fn(),
    uploadToStorage: vi.fn(),
  })
);

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useMutation: ({ mutationFn }: { mutationFn: unknown }) => ({
    mutateAsync: mutationFn,
  }),
}));

vi.mock('@tet/api', () => ({
  useTRPC: () => ({
    collectivites: {
      documents: {
        createUploadToken: {
          mutationOptions: () => ({ mutationFn: createUploadToken }),
        },
        create: {
          mutationOptions: () => ({ mutationFn: createDocument }),
        },
        listBibliothequeDocuments: { pathKey: () => [] },
      },
    },
  }),
}));

vi.mock('./upload-to-storage', () => ({ uploadToStorage }));

const hash = toDocumentHash(
  'ec07d0538e44a333b23b936c9a4ba37fbd211c6272e632d2173b6abe102a0482'
);
const file = new File(['%PDF'], 'rapport.pdf', { type: 'application/pdf' });

describe('useUploadFile', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    createUploadToken.mockResolvedValue({
      kind: UploadDecisionKindEnum.ALREADY_IN_STORAGE,
    });
    createDocument.mockResolvedValue({ id: 42 });
  });

  it('ne crée pas de document si le dépôt est annulé pendant la demande de jeton', async () => {
    const controller = new AbortController();
    createUploadToken.mockImplementation(async () => {
      controller.abort();
      return { kind: UploadDecisionKindEnum.ALREADY_IN_STORAGE };
    });
    const { result } = renderHook(() => useUploadFile());

    await expect(
      result.current({
        collectiviteId: 1,
        file,
        hash,
        signal: controller.signal,
      })
    ).rejects.toThrow(new DOMException('Upload aborted', 'AbortError'));

    expect(createDocument).not.toHaveBeenCalled();
    expect(uploadToStorage).not.toHaveBeenCalled();
  });

  it('termine la création en bibliothèque pour un fichier déjà stocké sans annulation', async () => {
    const { result } = renderHook(() => useUploadFile());

    await expect(
      result.current({ collectiviteId: 1, file, hash, confidentiel: true })
    ).resolves.toEqual({ kind: 'uploaded', fichierId: 42 });

    expect(createDocument).toHaveBeenCalledExactlyOnceWith({
      collectiviteId: 1,
      filename: file.name,
      hash,
      confidentiel: true,
    });
    expect(uploadToStorage).not.toHaveBeenCalled();
  });

  it('ne crée pas de document si le dépôt est annulé à la fin du transfert', async () => {
    const controller = new AbortController();
    createUploadToken.mockResolvedValue({
      kind: UploadDecisionKindEnum.READY_TO_UPLOAD,
      token: 'jeton-signe',
      bucketId: 'bucket-collectivite-1',
      path: hash,
    });
    uploadToStorage.mockImplementation(async () => {
      controller.abort();
    });
    const { result } = renderHook(() => useUploadFile());

    await expect(
      result.current({
        collectiviteId: 1,
        file,
        hash,
        signal: controller.signal,
      })
    ).rejects.toThrow(new DOMException('Upload aborted', 'AbortError'));

    expect(uploadToStorage).toHaveBeenCalledOnce();
    expect(createDocument).not.toHaveBeenCalled();
  });
});
