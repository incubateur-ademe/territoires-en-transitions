import { appLabels } from '@/app/labels/catalog';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useTRPC } from '@tet/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ReferentielId } from '@tet/domain/referentiels';

export function useGenerateArchive({
  collectiviteId,
  referentielId,
}: {
  collectiviteId: number;
  referentielId: ReferentielId;
}): { generate: () => void; isGenerating: boolean } {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setToast } = useToastContext();

  const { mutate, isPending } = useMutation(
    trpc.referentiels.preuvesArchive.request.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.preuvesArchive.list.queryKey({
            collectiviteId,
            referentielId,
          }),
        }),
    })
  );

  const generate = (): void => {
    if (isPending) return;
    mutate(
      { collectiviteId, referentielId },
      {
        onError: () =>
          setToast('error', appLabels.preuvesArchiveErreurGenerique),
      }
    );
  };

  return { generate, isGenerating: isPending };
}
