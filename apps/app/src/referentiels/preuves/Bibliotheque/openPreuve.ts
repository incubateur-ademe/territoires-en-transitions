import { createClientWithoutCookieOptions } from '@/api/utils/supabase/browser-client';
import { saveBlob } from './saveBlob';
import { TPreuve } from './types';

/**
 * Ouvre un document :
 * - dans un nouvel onglet pour les liens
 * - en téléchargement pour les fichiers
 */
export const openPreuve = async (preuve: TPreuve) => {
  const { fichier, lien } = preuve;
  if (fichier) {
    downloadPreuve(preuve);
  } else if (lien) {
    const { url } = lien;
    window.open(url);
  }
};

const downloadPreuve = async (preuve: TPreuve) => {
  const { filename, hash, bucket_id } = preuve.fichier || {};
  if (!filename || !hash || !bucket_id) {
    return;
  }

  // TODO: plutôt utiliser le client supabase de `useSupabase()`
  const supabase = createClientWithoutCookieOptions(); // télécharge le fichier
  const { data } = await supabase.storage.from(bucket_id).download(hash);

  if (data) {
    // et le sauvegarde si le téléchargement a réussi
    saveBlob(data, filename);
  }
};
