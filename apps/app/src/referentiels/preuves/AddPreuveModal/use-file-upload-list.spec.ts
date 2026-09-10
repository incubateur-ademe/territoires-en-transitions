import { act, renderHook } from '@testing-library/react';
import { toDocumentHash } from '@tet/domain/collectivites';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UploadErrorCode, UploadStatus, UploadStatusCode } from './types';
import { useFileUploadList } from './use-file-upload-list';

const HASH = toDocumentHash(
  'ec07d0538e44a333b23b936c9a4ba37fbd211c6272e632d2173b6abe102a0482'
);

const { uploadFile, hashFile } = vi.hoisted(() => ({
  uploadFile: vi.fn(),
  hashFile: vi.fn(),
}));

vi.mock('@/app/collectivites/documents/upload/use-upload-file', () => ({
  useUploadFile: () => uploadFile,
}));
vi.mock('@/app/collectivites/documents/upload/hash-file.utils', () => ({
  hashFile,
}));

const dropPdfAndListStatuses = async (): Promise<UploadStatus[]> => {
  const { result } = renderHook(() => useFileUploadList({ collectiviteId: 1 }));
  const pdf = new File(['%PDF'], 'rapport.pdf', { type: 'application/pdf' });

  await act(async () => {
    await result.current.onDropFiles([pdf]);
  });

  return result.current.items.map(({ status }) => status);
};

describe('useFileUploadList', () => {
  beforeEach(() => {
    uploadFile.mockReset();
    hashFile.mockResolvedValue(HASH);
  });

  it('signale en doublon, sous son nom enregistré, un fichier que la demande de jeton trouve déjà dans la bibliothèque', async () => {
    uploadFile.mockResolvedValue({
      kind: 'alreadyInBibliotheque',
      fichierId: 42,
      filename: 'rapport-existant.pdf',
    });

    expect(await dropPdfAndListStatuses()).toEqual([
      {
        code: UploadStatusCode.duplicated,
        fichierId: 42,
        filename: 'rapport-existant.pdf',
        hash: HASH,
      },
    ]);
  });

  it('marque téléversé un fichier ajouté à la bibliothèque', async () => {
    uploadFile.mockResolvedValue({ kind: 'uploaded', fichierId: 7 });

    expect(await dropPdfAndListStatuses()).toEqual([
      { code: UploadStatusCode.completed, fichierId: 7, hash: HASH },
    ]);
  });

  it('marque en échec de téléversement un fichier dont la demande de jeton échoue', async () => {
    uploadFile.mockRejectedValue(new Error('SIGN_UPLOAD_ERROR'));

    expect(await dropPdfAndListStatuses()).toEqual([
      { code: UploadStatusCode.failed, error: UploadErrorCode.uploadError },
    ]);
  });
});
