import { Filters } from '@/app/plans/fiches/list-all-fiches/filters/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RouterInput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useEventTracker } from '@tet/ui';
import { Event } from '@tet/ui/components/tracking/posthog-events';

export type BulkEditRequest = RouterInput['plans']['fiches']['bulkEdit'];

const events = {
  pilotes: Event.fiches.updatePilote.multiple,
  referents: Event.fiches.updateReferent.multiple,
  services: Event.fiches.updateService.multiple,
  statut: Event.fiches.updateStatut.multiple,
  priorite: Event.fiches.updatePriorite.multiple,
  dateFin: Event.fiches.updatePlanning.multiple,
  ameliorationContinue: Event.fiches.updatePlanning.multiple,
  libreTags: Event.fiches.updateTagsLibres.multiple,
  acces: Event.fiches.updateAcces.multiple,
} as const;

export const useBulkFichesEdit = ({
  filters,
  selectedFicheIds,
}: {
  filters: Filters;
  selectedFicheIds: number[] | 'all';
}) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const eventTracker = useEventTracker();

  const { mutate, isPending } = useMutation(
    trpc.plans.fiches.bulkEdit.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.plans.fiches.listFiches.queryKey({
            collectiviteId,
          }),
        });
      },
    })
  );

  return {
    mutate:
      (id: keyof typeof events) =>
      (
        input: Pick<
          BulkEditRequest,
          | 'pilotes'
          | 'referents'
          | 'services'
          | 'statut'
          | 'priorite'
          | 'dateFin'
          | 'ameliorationContinue'
          | 'libreTags'
          | 'sharedWithCollectivites'
        >
      ) => {
        eventTracker(events[id]);
        if (selectedFicheIds === 'all') {
          return mutate({
            ...input,
            filters,
            collectiviteId,
            ficheIds: 'all',
          });
        }

        return mutate({
          ...input,
          ficheIds: selectedFicheIds,
          collectiviteId,
        });
      },
    isPending,
  };
};
