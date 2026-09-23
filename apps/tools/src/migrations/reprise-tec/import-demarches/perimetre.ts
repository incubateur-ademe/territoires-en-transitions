import { LigneDemarche } from './lecture';

export type Motif = 'coquille_vide' | 'sans_etat_invisible' | 'doublon';

/** Règle : écarte les dossiers vides, les sans-état jamais visibles et les doublons. */
export const calculatePerimetre = (lignes: readonly LigneDemarche[]) => {
  const doublons = listDoublons(lignes);
  const contenuParDossier = calculateContenuParDossier(lignes, doublons);

  /** Pourquoi la ligne est écartée, ou `null` si elle est gardée. */
  const motifDEcart = (l: LigneDemarche): Motif | null => {
    const dossier = doublons.get(l.id) ?? l.id;
    if (contenuParDossier.get(dossier) === 0) {
      return 'coquille_vide';
    }
    if (l.etat === null && !l.publie) {
      return 'sans_etat_invisible';
    }
    if (doublons.has(l.id)) {
      return 'doublon';
    }
    return null;
  };

  const ecartees = lignes.flatMap((l) => {
    const motif = motifDEcart(l);
    return motif ? [{ id: l.id, motif }] : [];
  });
  const retenues = lignes.filter((l) => motifDEcart(l) === null);

  return { retenues, ecartees };
};

/**
 * Un PCAET déposé existe deux fois dans T&C : le dossier (« mise en œuvre ») et
 * son doublon (« définitif »). Rend, pour chaque doublon, son dossier.
 */
const listDoublons = (lignes: readonly LigneDemarche[]) =>
  new Map(
    lignes
      .filter((l) => l.pcaetDefinitif !== null)
      .map((l) => [l.pcaetDefinitif as number, l.id])
  );

/** Le contenu de chaque dossier, doublon compris. */
const calculateContenuParDossier = (
  lignes: readonly LigneDemarche[],
  doublons: Map<number, number>
) => {
  const contenu = new Map<number, number>();
  for (const l of lignes) {
    const dossier = doublons.get(l.id) ?? l.id;
    contenu.set(dossier, (contenu.get(dossier) ?? 0) + l.contenu);
  }
  return contenu;
};
