import { downloadFichier } from './download-fichier';
import { Preuve } from './types';

/**
 * Ouvre un document :
 * - dans un nouvel onglet pour les liens
 * - en téléchargement pour les fichiers
 */
export const openPreuve = async (preuve: Preuve) => {
  const { fichier, lien } = preuve;
  if (fichier) {
    const { filename, hash, bucketId } = fichier;
    downloadFichier({ bucketId: bucketId, hash, filename });
  } else if (lien) {
    const { url } = lien;
    window.open(url);
  }
};
