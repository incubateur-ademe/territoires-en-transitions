import { useToastContext } from '@/app/utils/toast/toast-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useUpsertBannerInfo = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setToast } = useToastContext();

  return useMutation(
    trpc.banner.upsert.mutationOptions({
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries({
          queryKey: trpc.banner.get.queryKey(),
        });
        setToast(
          'success',
          variables.active ? 'Bannière mise à jour' : 'Bannière désactivée'
        );
      },
      onError: (error) => {
        const code = error.data?.code ?? 'UNKNOWN';
        const message = error.message || 'Une erreur est survenue';
        setToast(
          'error',
          `Erreur lors de l'enregistrement: ${message} (${code})`
        );
      },
    })
  );
};
