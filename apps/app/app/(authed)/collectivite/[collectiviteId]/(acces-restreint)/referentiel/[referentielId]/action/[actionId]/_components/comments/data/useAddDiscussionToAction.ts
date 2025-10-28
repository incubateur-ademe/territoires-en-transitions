import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import { ReferentielId } from '@/domain/referentiels';

/**
 * Ajouter une nouvelle discussion à une action
 */
export const useAddDiscussionToAction = (
  action_id: string,
  referentielId: ReferentielId
) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();
  const trpc = useTRPC();

  return useMutation(
    trpc.collectivites.discussions.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.collectivites.discussions.list.queryKey({
            collectiviteId: collectivite_id!,
            referentielId: referentielId,
            filters: {
              actionId: action_id,
            },
          }),
        });
      },
    })
  );
};
