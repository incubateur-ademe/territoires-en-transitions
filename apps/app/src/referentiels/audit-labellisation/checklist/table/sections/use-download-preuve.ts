import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { Fichier } from '@/app/referentiels/preuves/Bibliotheque/types';
import { useSupabase } from '@tet/api';
import { useCallback } from 'react';

export type DownloadableFichier = Pick<
  Fichier,
  'bucketId' | 'hash' | 'filename'
>;

export const useDownloadPreuve = (): ((
  fichier: DownloadableFichier
) => Promise<void>) => {
  const supabase = useSupabase();

  return useCallback(
    async (fichier: DownloadableFichier): Promise<void> => {
      const { data } = await supabase.storage
        .from(fichier.bucketId)
        .download(fichier.hash);
      if (data) {
        await saveBlob(data, fichier.filename);
      }
    },
    [supabase]
  );
};
