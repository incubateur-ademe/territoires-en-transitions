import {supabaseClient} from 'core-logic/api/supabase';
import {Doc, DocFile, DocLink} from './types';

/**
 * Ouvre un document :
 * - dans un nouvel onglet pour les liens
 * - en téléchargement pour les fichiers
 */
export const openDoc = async (doc: Doc) => {
  const {type} = doc;
  if (type === 'fichier') {
    const {filename, bucket_id} = doc as DocFile;
    // télécharge le fichier car l'ouverture directe de l'URL ne fonctionne
    // pas, les headers d'authenfication étant absents
    const {data} = await supabaseClient.storage
      .from(bucket_id)
      .download(filename);

    // si le téléchargement a réussi
    if (data) {
      // crée un blob
      const blobURL = URL.createObjectURL(data);

      // crée un lien invisible
      const a = document.createElement('a');
      document.body.appendChild(a);

      // affecte au lien le blob et le nom du fichier téléchargé
      a.href = blobURL;
      a.download = filename;

      // déclenche le téléchargement puis supprime le lien
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(blobURL);
        document.body.removeChild(a);
      }, 0);
    }
  } else {
    const {url} = doc as DocLink;
    window.open(url);
  }
};
