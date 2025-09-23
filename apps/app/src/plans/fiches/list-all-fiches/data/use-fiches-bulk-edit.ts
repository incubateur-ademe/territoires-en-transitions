import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import { Filters } from '@/app/plans/fiches/list-all-fiches/filters/types';
import { BulkEditRequest } from '@/domain/plans/fiches';
import { useEventTracker } from '@/ui';
import { Event } from '@/ui/components/tracking/posthog-events';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const events = {
  pilotes: Event.fiches.updatePilotesGroupe,
  statut: Event.fiches.updateStatutGroupe,
  priorite: Event.fiches.updatePrioriteGroupe,
  dateFin: Event.fiches.updatePlanningGroupe,
  ameliorationContinue: Event.fiches.updatePlanningGroupe,
  libreTags: Event.fiches.updateTagsLibresGroupe,
  acces: Event.fiches.updateAccesGroupe,
} as const;

export const useFichesBulkEdit = ({
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
          queryKey: trpc.plans.fiches.listFilteredFiches.queryKey({
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
