import {supabaseClient} from 'core-logic/api/supabase';
import {TPreuve} from './types';
import {saveBlob} from './saveBlob';

/**
 * Ouvre un document :
 * - dans un nouvel onglet pour les liens
 * - en téléchargement pour les fichiers
 */
export const openPreuve = async (preuve: TPreuve) => {
  const {fichier, lien} = preuve;
  if (fichier) {
    downloadPreuve(preuve);
  } else if (lien) {
    const {url} = lien;
    window.open(url);
  }
};

const downloadPreuve = async (preuve: TPreuve) => {
  const {filename, hash, bucket_id} = preuve.fichier!;

  // télécharge le fichier
  const {data} = await supabaseClient.storage.from(bucket_id).download(hash);

  if (data) {
    // et le sauvegarde si le téléchargement a réussi
    saveBlob(data, filename);
  }
};
