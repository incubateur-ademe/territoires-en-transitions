/// <reference types="vitest/globals" />
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toDocumentHash } from '@tet/domain/collectivites';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AddFile } from './AddFile';
import { FileUploadItem } from './FileItem';
import { UploadStatusCode } from './types';

const HASH = toDocumentHash('a'.repeat(64));

const onAddFileFromLib = vi.fn();
const onClose = vi.fn();
const onDuplicatedDocumentsAdded = vi.fn();

const { fileUploadItems } = vi.hoisted(() => {
  const fileUploadItems: { current: FileUploadItem[] } = { current: [] };
  return { fileUploadItems };
});

vi.mock('@tet/api/collectivites', () => ({
  useCollectiviteId: () => 1,
}));

vi.mock('../Bibliotheque/useEditPreuve', () => ({
  useUpdateBibliothequeFichier: () => ({ mutate: vi.fn() }),
}));

vi.mock('./use-file-upload-list', () => ({
  useFileUploadList: () => ({
    items: fileUploadItems.current,
    onDropFiles: vi.fn(),
    onDismissItem: vi.fn(),
  }),
}));

const duplicatedItem: FileUploadItem = {
  id: 'item-1',
  file: new File([''], 'nouveau nom.pdf', { type: 'application/pdf' }),
  status: {
    code: UploadStatusCode.duplicated,
    fichierId: 1,
    filename: 'nom-original.pdf',
    hash: HASH,
  },
};

const preparingItem: FileUploadItem = {
  id: 'item-2',
  file: new File([''], 'en cours.pdf', { type: 'application/pdf' }),
  status: {
    code: UploadStatusCode.preparing,
    hash: HASH,
    abort: vi.fn(),
  },
};

describe('AddFile duplicate notice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onAddFileFromLib.mockResolvedValue({ preuveId: 42 });
  });

  test('forwards duplicated files after confirmation', async () => {
    fileUploadItems.current = [duplicatedItem];
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
        hash: HASH,
        preuveId: 42,
        preuveType: 'annexe',
        storedFilenameKept: true,
      },
    ]);
    expect(onClose).toHaveBeenCalled();
  });

  test("désactive l'ajout tant qu'un fichier est encore en préparation", () => {
    fileUploadItems.current = [duplicatedItem, preparingItem];
    render(
      <AddFile
        docType="annexe"
        onAddFileFromLib={onAddFileFromLib}
        onClose={onClose}
      />
    );

    expect(screen.getByRole('button', { name: 'Ajouter' })).toHaveProperty(
      'disabled',
      true
    );
  });
});
