import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TBibliothequeFichier } from '../Bibliotheque/types';

/** Ajoute le fichier dans la bibliothèque */
export const useAddFileToLib = () => {
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  const { isPending, mutateAsync } = useMutation({
    mutationFn: async ({
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

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['bibliotheque_fichier'],
      });
    },
  });
  return { isPending, addFileToLib: mutateAsync };
};
