import { Fichier, PreuveLien, PreuveSupport } from './types';

export const toPreuveSupport = ({
  fichier,
  lien,
}: {
  fichier: Fichier | null;
  lien: PreuveLien | null;
}): PreuveSupport => {
  if (fichier) {
    return { type: 'fichier', fichier };
  }
  if (lien) {
    return { type: 'lien', lien };
  }
  return { type: 'nonRenseigne' };
};

export const getPreuveFichier = (support: PreuveSupport): Fichier | null =>
  support.type === 'fichier' ? support.fichier : null;

export const getPreuveLien = (support: PreuveSupport): PreuveLien | null =>
  support.type === 'lien' ? support.lien : null;
