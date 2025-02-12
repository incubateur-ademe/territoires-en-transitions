import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useMutation, useQueryClient } from 'react-query';
import { TBibliothequeFichier } from '../Bibliotheque/types';

/** Ajoute le fichier dans la bibliothèque */
export const useAddFileToLib = () => {
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  const { isLoading, mutateAsync } = useMutation(
    async ({
      collectivite_id,
      hash,
      filename,
    }: {
      collectivite_id: number;
      hash: string;
      filename: string;
    }) => {
      const { error, data } = await supabase
        .rpc('add_bibliotheque_fichier', { collectivite_id, hash, filename })
        .single();
      if (error || !data) {
        throw new Error(error?.message || '');
      }
      return data as TBibliothequeFichier;
    },
    {
      mutationKey: 'add_bibliotheque_fichier',
      onSuccess: () => {
        queryClient.invalidateQueries(['bibliotheque_fichier']);
      },
    }
  );
  return { isLoading, addFileToLib: mutateAsync };
};
