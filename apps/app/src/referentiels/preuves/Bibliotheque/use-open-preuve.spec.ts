import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { preuveReglementaireFichier, preuveReglementaireLien } from './fixture';
import { useOpenPreuve } from './use-open-preuve';

const { downloadDocument, telechargementEnCours } = vi.hoisted(() => ({
  downloadDocument: vi.fn(),
  telechargementEnCours: { value: false },
}));

vi.mock('../data/use-download-document', () => ({
  useDownloadDocument: () => ({
    mutate: downloadDocument,
    isPending: telechargementEnCours.value,
  }),
}));

const COLLECTIVITE_ID = 1;

const renderOpenPreuve = () =>
  renderHook(() => useOpenPreuve({ collectiviteId: COLLECTIVITE_ID })).result;

describe('useOpenPreuve', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    downloadDocument.mockReset();
    telechargementEnCours.value = false;
  });

  it('télécharge le fichier par son identifiant', () => {
    const openPreuve = renderOpenPreuve();

    openPreuve.current(preuveReglementaireFichier);

    expect(downloadDocument).toHaveBeenCalledWith(
      preuveReglementaireFichier.fichier?.id
    );
  });

  it('ignore un clic tant que le téléchargement précédent est en cours', () => {
    telechargementEnCours.value = true;
    const openPreuve = renderOpenPreuve();

    openPreuve.current(preuveReglementaireFichier);

    expect(downloadDocument).not.toHaveBeenCalled();
  });

  it("ouvre un lien externe sans lui laisser atteindre la fenêtre d'origine", () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const openPreuve = renderOpenPreuve();

    openPreuve.current(preuveReglementaireLien);

    expect(open).toHaveBeenCalledWith(
      preuveReglementaireLien.lien?.url,
      '_blank',
      'noopener,noreferrer'
    );
  });
});
