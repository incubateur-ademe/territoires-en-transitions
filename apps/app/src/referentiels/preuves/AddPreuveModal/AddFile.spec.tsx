/// <reference types="vitest/globals" />
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AddFile } from './AddFile';
import { UploadStatusCode } from './types';

const onAddFileFromLib = vi.fn();
const onClose = vi.fn();
const onDuplicatedDocumentsAdded = vi.fn();

vi.mock('@tet/api/collectivites', () => ({
  useCollectiviteId: () => 1,
}));

vi.mock('../Bibliotheque/useEditPreuve', () => ({
  useUpdateBibliothequeFichier: () => ({ mutate: vi.fn() }),
}));

vi.mock('./use-file-upload-list', () => ({
  useFileUploadList: () => ({
    items: [
      {
        file: new File([''], 'nouveau nom.pdf', { type: 'application/pdf' }),
        status: {
          code: UploadStatusCode.duplicated,
          fichier_id: 1,
          filename: 'nom-original.pdf',
          hash: 'hash-1',
        },
      },
    ],
    onDropFiles: vi.fn(),
    onStatusChange: vi.fn(),
    onDismissItem: vi.fn(),
  }),
}));

describe('AddFile duplicate notice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onAddFileFromLib.mockResolvedValue({ preuveId: 42 });
  });

  test('forwards duplicated files after confirmation', async () => {
    render(
      <AddFile
        docType="annexe"
        onAddFileFromLib={onAddFileFromLib}
        onDuplicatedDocumentsAdded={onDuplicatedDocumentsAdded}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));

    await waitFor(() => {
      expect(onAddFileFromLib).toHaveBeenCalledWith(1);
    });
    expect(onDuplicatedDocumentsAdded).toHaveBeenCalledWith([
      {
        hash: 'hash-1',
        preuveId: 42,
        preuveType: 'annexe',
        storedFilenameKept: true,
      },
    ]);
    expect(onClose).toHaveBeenCalled();
  });
});
