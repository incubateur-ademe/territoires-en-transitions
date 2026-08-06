import { createClientWithoutCookieOptions } from '@tet/api/utils/supabase/browser-client';
import { saveBlob } from './saveBlob';

/**
 * Télécharge un fichier de la bibliothèque d'une collectivité. Le nom de l'objet
 * dans le bucket est son hash ; `filename` n'est que le nom d'affichage.
 */
export const downloadFichier = async ({
  bucketId,
  hash,
  filename,
}: {
  bucketId: string | null | undefined;
  hash: string | null | undefined;
  filename: string | null | undefined;
}): Promise<void> => {
  if (!bucketId || !hash || !filename) {
    return;
  }

  // TODO: plutôt utiliser le client supabase de `useSupabase()`
  const supabase = createClientWithoutCookieOptions();
  const { data } = await supabase.storage.from(bucketId).download(hash);

  if (data) {
    saveBlob(data, filename);
  }
};
