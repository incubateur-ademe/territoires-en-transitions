import { appLabels } from '@/app/labels/catalog';
import { toDocumentHash } from '@tet/domain/collectivites';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AddFile } from './add-file';
import { FileUploadItem } from './file-item';
import { DocType, UploadStatusCode } from './types';

const COLLECTIVITE_ID = 1;
const UPLOADED_FICHIER_ID = 7;
const UPLOADED_HASH = toDocumentHash(
  'ec07d0538e44a333b23b936c9a4ba37fbd211c6272e632d2173b6abe102a0482'
);
const DUPLICATED_HASH = toDocumentHash(
  '3f2a91c4d8be5071a6c33f0e7b19d2458ac6e0fb17d93825c4a0e6b71f8d2c93'
);

const { updateDocument, onAddFile, onClose, items } = vi.hoisted(() => ({
  updateDocument: vi.fn(),
  onAddFile: vi.fn(),
  onClose: vi.fn(),
  items: { current: [] as FileUploadItem[] },
}));

vi.mock(
  '@tet/api/collectivites',
  (): Partial<
    Record<keyof typeof import('@tet/api/collectivites'), unknown>
  > => ({
    useCollectiviteId: () => COLLECTIVITE_ID,
  })
);

vi.mock(
  '../bibliotheque/use-edit-preuve',
  (): Partial<
    Record<keyof typeof import('../bibliotheque/use-edit-preuve'), unknown>
  > => ({
    useUpdateBibliothequeFichier: () => ({
      mutate: updateDocument,
      mutateAsync: updateDocument,
    }),
  })
);

vi.mock(
  './use-file-upload-list',
  (): Partial<
    Record<keyof typeof import('./use-file-upload-list'), unknown>
  > => ({
    useFileUploadList: () => ({
      items: items.current,
      onDropFiles: vi.fn(),
      onDismissItem: vi.fn(),
    }),
  })
);

const toFile = (name: string): File =>
  new File(['%PDF'], name, { type: 'application/pdf' });

const uploadedFichier: FileUploadItem = {
  id: 'uploaded',
  file: toFile('rapport.pdf'),
  status: {
    code: UploadStatusCode.completed,
    fichierId: UPLOADED_FICHIER_ID,
    hash: UPLOADED_HASH,
  },
};

const duplicatedFichier: FileUploadItem = {
  id: 'duplicated',
  file: toFile('existant.pdf'),
  status: {
    code: UploadStatusCode.duplicated,
    fichierId: 42,
    filename: 'existant.pdf',
    hash: DUPLICATED_HASH,
  },
};

const renderAddFile = ({ docType }: { docType?: DocType } = {}) =>
  render(<AddFile docType={docType} onAddFile={onAddFile} onClose={onClose} />);

const checkConfidentiel = () =>
  fireEvent.click(
    screen.getByRole('checkbox', { name: appLabels.fichierModePrive })
  );

const submitModal = async () =>
  act(async () => {
    fireEvent.click(screen.getByRole('button', { name: appLabels.ajouter }));
  });

describe('AddFile', () => {
  beforeEach(() => {
    updateDocument.mockReset();
    updateDocument.mockResolvedValue(undefined);
    onAddFile.mockReset();
    onClose.mockReset();
    items.current = [uploadedFichier];
  });

  it("n'écrit pas la confidentialité tant que la modale n'est pas validée", () => {
    renderAddFile({ docType: 'complementaire' });

    expect(updateDocument).not.toHaveBeenCalled();
  });

  it("n'écrit pas la confidentialité en cochant la case", () => {
    renderAddFile({ docType: 'complementaire' });

    checkConfidentiel();

    expect(updateDocument).not.toHaveBeenCalled();
  });

  it('écrit une seule fois la confidentialité cochée, à la validation', async () => {
    renderAddFile({ docType: 'complementaire' });

    checkConfidentiel();
    await submitModal();

    expect(updateDocument).toHaveBeenCalledExactlyOnceWith({
      collectiviteId: COLLECTIVITE_ID,
      hash: UPLOADED_HASH,
      confidentiel: true,
    });
  });

  it('laisse sa confidentialité à un fichier déjà présent dans la bibliothèque', async () => {
    items.current = [duplicatedFichier];
    renderAddFile({ docType: 'complementaire' });

    checkConfidentiel();
    await submitModal();

    expect(updateDocument).not.toHaveBeenCalled();
  });

  it("n'écrit la confidentialité que sur le fichier téléversé quand la sélection mélange les deux", async () => {
    items.current = [duplicatedFichier, uploadedFichier];
    renderAddFile({ docType: 'complementaire' });

    checkConfidentiel();
    await submitModal();

    expect(updateDocument).toHaveBeenCalledExactlyOnceWith({
      collectiviteId: COLLECTIVITE_ID,
      hash: UPLOADED_HASH,
      confidentiel: true,
    });
  });

  it("n'écrit pas de confidentialité pour un type de document qui n'offre pas le choix", async () => {
    renderAddFile({ docType: 'rapport' });

    await submitModal();

    expect(updateDocument).not.toHaveBeenCalled();
  });

  it('rattache le fichier et ferme la modale quand tout aboutit', async () => {
    renderAddFile({ docType: 'complementaire' });

    checkConfidentiel();
    await submitModal();

    expect(onAddFile).toHaveBeenCalledExactlyOnceWith(UPLOADED_FICHIER_ID);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('ne rattache pas le fichier et laisse la modale ouverte quand la confidentialité échoue', async () => {
    updateDocument.mockRejectedValueOnce(new Error('UPDATE_FAILED'));
    renderAddFile({ docType: 'complementaire' });

    checkConfidentiel();
    await submitModal();

    expect(onAddFile).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
