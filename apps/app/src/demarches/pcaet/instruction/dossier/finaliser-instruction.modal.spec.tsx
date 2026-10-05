import { appLabels } from '@/app/labels/catalog';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FinaliserInstructionModal } from './finaliser-instruction.modal';

const { uploadAvisFile, upsertAvis, validerAvis } = vi.hoisted(() => ({
  uploadAvisFile: vi.fn(),
  upsertAvis: vi.fn(),
  validerAvis: vi.fn(),
}));

vi.mock('./data/use-upload-avis-file', () => ({
  useUploadAvisFile: () => uploadAvisFile,
}));
vi.mock('./data/use-upsert-avis', () => ({
  useUpsertAvis: () => ({ mutateAsync: upsertAvis }),
}));
vi.mock('./data/use-valider-avis', () => ({
  useValiderAvis: () => ({ mutateAsync: validerAvis }),
}));

const HASH = 'a0d9c76155083ec735b0a6c765ee161808a9ab862b5656bbcdbd2d8371031d79';

const renderModal = (onClose = vi.fn()) => {
  render(
    <FinaliserInstructionModal
      demandeAvisId={1}
      auTitreDe="prefet_region"
      onClose={onClose}
    />
  );
  return onClose;
};

const choisirRapportPuisValider = () => {
  const input = document.querySelector('input[type="file"]');
  if (!input) throw new Error('champ fichier introuvable');
  const pdf = new File(['%PDF'], 'avis.pdf', { type: 'application/pdf' });
  fireEvent.change(input, { target: { files: [pdf] } });
  fireEvent.click(
    screen.getByRole('button', { name: appLabels.instructionFinaliserValider })
  );
};

describe("Modale de finalisation de l'instruction", () => {
  beforeEach(() => {
    uploadAvisFile.mockReset();
    upsertAvis.mockReset();
    validerAvis.mockReset();
  });

  it('montre la progression du dépôt, qui sans cela passe pour un gel', async () => {
    uploadAvisFile.mockReturnValue(new Promise(() => undefined));
    renderModal();

    choisirRapportPuisValider();
    const { onProgress } = uploadAvisFile.mock.calls[0][1];
    act(() => onProgress(42));

    expect(
      screen.getByText(appLabels.progressionUpload({ progress: 42 }))
    ).toBeDefined();
  });

  it("laisse annuler un dépôt en cours, sans valider l'avis ensuite", async () => {
    let terminerUpload: (hash: string) => void = () => undefined;
    uploadAvisFile.mockReturnValue(
      new Promise((resolve) => {
        terminerUpload = resolve;
      })
    );
    const onClose = renderModal();

    choisirRapportPuisValider();
    const { signal } = uploadAvisFile.mock.calls[0][1];
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    await act(async () => terminerUpload(HASH));

    expect(onClose).toHaveBeenCalled();
    expect(signal.aborted).toBe(true);
    expect(upsertAvis).not.toHaveBeenCalled();
  });
});
