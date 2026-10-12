import { appLabels } from '@/app/labels/catalog';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { invalidateIndicateurValeursQueries } from './invalidate-indicateur-valeurs-queries';

type UseUpsertIndicateurValeurOptions = {
  successMessage?: string;
  errorMessage?: string;
  disableCreateToast?: boolean;
  disableErrorToast?: boolean;
};

export const useUpsertIndicateurValeur = ({
  successMessage = appLabels.indicateurValeurAjoutee,
  errorMessage,
  disableCreateToast = false,
  disableErrorToast = false,
}: UseUpsertIndicateurValeurOptions = {}) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setToast } = useToastContext();

  return useMutation(
    trpc.indicateurs.valeurs.upsert.mutationOptions({
      meta: { disableToast: true },
      onSuccess: async (_, variables) => {
        const { collectiviteId } = variables;
        if (!variables.id && !disableCreateToast) {
          setToast('success', successMessage);
        }

        await invalidateIndicateurValeursQueries({
          queryClient,
          trpc,
          collectiviteId,
        });
      },
      onError: (_, variables) => {
        if (!disableErrorToast) {
          setToast(
            'error',
            errorMessage ??
              (variables.id
                ? appLabels.indicateurValeurModifieeErreur
                : appLabels.indicateurValeurAjouteeErreur)
          );
        }
      },
    })
  );
};
