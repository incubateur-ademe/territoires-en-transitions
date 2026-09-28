import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { appLabels } from '@/app/labels/catalog';

export type IndicateurVue = RouterOutput['indicateurs']['vues']['list'][number];

export function useListIndicateurVues() {
  const trpc = useTRPC();
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();

  return useQuery(
    trpc.indicateurs.vues.list.queryOptions(
      { collectiviteId },
      { enabled: hasCollectivitePermission('indicateurs.vues.read') }
    )
  );
}

function useInvalidateIndicateurVues() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return (collectiviteId: number) =>
    queryClient.invalidateQueries({
      queryKey: trpc.indicateurs.vues.list.queryKey({ collectiviteId }),
    });
}

export function useCreateIndicateurVue() {
  const trpc = useTRPC();
  const invalidateVues = useInvalidateIndicateurVues();

  return useMutation(
    trpc.indicateurs.vues.create.mutationOptions({
      onSuccess: (_vue, input) => invalidateVues(input.collectiviteId),
      meta: {
        success: appLabels.indicateurVueCreated,
        error: appLabels.indicateurVueSaveError,
      },
    })
  );
}

export function useUpdateIndicateurVue() {
  const trpc = useTRPC();
  const invalidateVues = useInvalidateIndicateurVues();

  return useMutation(
    trpc.indicateurs.vues.update.mutationOptions({
      onSuccess: (_vue, input) => invalidateVues(input.collectiviteId),
      meta: {
        success: appLabels.indicateurVueUpdated,
        error: appLabels.indicateurVueSaveError,
      },
    })
  );
}

export function useDeleteIndicateurVue() {
  const trpc = useTRPC();
  const invalidateVues = useInvalidateIndicateurVues();

  return useMutation(
    trpc.indicateurs.vues.delete.mutationOptions({
      onSuccess: (_vue, input) => invalidateVues(input.collectiviteId),
      meta: {
        success: appLabels.indicateurVueDeleted,
        error: appLabels.indicateurVueDeleteError,
      },
    })
  );
}
