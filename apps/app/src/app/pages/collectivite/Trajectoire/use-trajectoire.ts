import { useCurrentCollectivite } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import { CalculTrajectoireResultatMode } from '@/domain/indicateurs';
import { Event, useEventTracker } from '@/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** Charge la trajectoire */
export const useGetTrajectoire = ({
  enabled = true,
}: {
  enabled?: boolean;
} = {}) => {
  const { collectiviteId } = useCurrentCollectivite();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const trackEvent = useEventTracker();

  return useQuery(
    trpc.indicateurs.trajectoires.snbc.getOrCompute.queryOptions(
      {
        collectiviteId,
      },
      {
        enabled,
        retry: false,
        refetchOnMount: false,

        // Utilise le `select` comme un `onSuccess` pour mettre à jour les caches de valeurs des indicateurs.
        // Utile dans le cas de l'affichage de la trajectoire sur le graphe d'un indicateur concerné (cae_1.a, cae_2.a)
        // et son sélecteur de sources.
        select: (data) => {
          const newCompute =
            data.mode ===
            CalculTrajectoireResultatMode.MAJ_SPREADSHEET_EXISTANT;

          if (newCompute) {
            queryClient.invalidateQueries({
              queryKey: trpc.indicateurs.valeurs.list.queryKey({
                collectiviteId,
              }),
            });

            queryClient.invalidateQueries({
              queryKey: trpc.indicateurs.sources.available.queryKey({
                collectiviteId,
              }),
            });
          }

          trackEvent(Event.trajectoire.triggerSnbcCalculation, {
            source: newCompute ? 'collectivite' : 'open_data',
          });

          return data;
        },
      }
    )
  );
};

/** Déclenche le calcul de la trajectoire */
export const useComputeTrajectoire = ({
  onSuccess,
}: {
  onSuccess?: () => void;
} = {}) => {
  const { collectiviteId } = useCurrentCollectivite();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.indicateurs.trajectoires.snbc.compute.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.setQueryData(
          trpc.indicateurs.trajectoires.snbc.getOrCompute.queryKey({
            collectiviteId,
          }),
          data
        );
        onSuccess?.();
      },
    })
  );
};
