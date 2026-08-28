import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { Event, useEventTracker } from '@tet/ui';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export const useSwitchToTe = () => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const trackEvent = useEventTracker();

  const mutation = useMutation(
    trpc.referentiels.switchToTe.mutationOptions({
      onSuccess: ({ populatedAt, populatedBy, status }, { collectiviteId }) => {
        if (status === 'switched') {
          trackEvent(Event.referentiels.switchToTeSuccess, {
            collectiviteId,
            populatedAt,
            populatedBy,
          });
        }
      },
    })
  );

  /**
   * À appeler une fois que l'utilisateur a vu l'écran de succès et ferme la
   * modale. On ne peut pas rafraîchir dans `onSuccess` : `router.refresh()`
   * fait repasser les préférences (SSR) en mode édition, ce qui démonte le
   * bandeau `readonly` — et la modale qu'il porte — avant l'affichage du
   * résultat.
   */
  const applySwitch = useCallback(async () => {
    // les prefs vivent dans le contexte user/collectivité (SSR), pas dans React Query
    router.refresh();

    // données référentiel migrées (statuts, scores, snapshots…)
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: trpc.referentiels.actions.listActionsGroupedById.pathKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.referentiels.snapshots.getCurrent.pathKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.referentiels.snapshots.list.pathKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.plans.fiches.listFiches.pathKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.plans.fiches.get.pathKey(),
      }),
    ]);
  }, [router, queryClient, trpc]);

  return { ...mutation, applySwitch };
};
