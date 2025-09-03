import { useTRPC } from '@/api/utils/trpc/client';
import { useNPSSurveyManager } from '@/ui/components/tracking/use-nps-survey-manager';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uniq } from 'es-toolkit';

/** Met à jour un ou plusieurs membres */
export const useUpdateMembres = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { trackUpdateOperation } = useNPSSurveyManager();
  return useMutation(
    trpc.collectivites.membres.update.mutationOptions({
      onSuccess: (data, variables) => {
        const collectiviteIds = uniq(variables.map((v) => v.collectiviteId));
        collectiviteIds.forEach((collectiviteId) => {
          queryClient.invalidateQueries({
            queryKey: trpc.collectivites.membres.list.queryKey({
              collectiviteId,
            }),
          });
        });
        trackUpdateOperation('referentiels');
      },
    })
  );
};
