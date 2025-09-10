import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

type Args = {
  collectiviteId: number;
  ficheId: number;
  /** Url de redirection à la suppression de la fiche */
  redirectPath?: string;
};

/**
 * Supprime une fiche action d'une collectivité
 */
export const useDeleteFicheAction = (args: Args) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const supabase = useSupabase();
  const trpcClient = useTRPC();
  const { ficheId, collectiviteId } = args;

  return useMutation({
    mutationFn: async () => {
      const { data } = await supabase
        .from('fiche_action')
        .delete()
        .eq('id', ficheId)
        .select();
      return data;
    },
    meta: { disableToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpcClient.plans.fiches.listResumes.queryKey({
          collectiviteId,
        }),
      });

      if (args.redirectPath) {
        router.push(args.redirectPath);
      }
    },
  });
};
