import { downloadFichier } from './download-fichier';
import { TPreuve } from './types';

/**
 * Ouvre un document :
 * - dans un nouvel onglet pour les liens
 * - en téléchargement pour les fichiers
 */
export const openPreuve = async (preuve: TPreuve) => {
  const { fichier, lien } = preuve;
  if (fichier) {
    const { filename, hash, bucket_id } = fichier;
    downloadFichier({ bucketId: bucket_id, hash, filename });
  } else if (lien) {
    const { url } = lien;
    window.open(url);
  }
};
