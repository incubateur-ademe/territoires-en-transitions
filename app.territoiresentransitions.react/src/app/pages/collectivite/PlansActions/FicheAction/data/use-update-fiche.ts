import { useCollectiviteId } from '@/api/collectivites';
import { trpc } from '@/api/utils/trpc/client';
import { useQueryClient } from 'react-query';

export const useUpdateFiche = () => {
  const utils = trpc.useUtils();
  const collectiviteId = useCollectiviteId();
  const queryClient = useQueryClient();

  return trpc.plans.fiches.update.useMutation({
    // Optimistic update
    // onMutate({ficheId, ficheFields}) {
    //   const queryKey = utils.plans.fiches.update.getMutationDefaults()
    // queryKey?.mutationKey
    // Cancel any outgoing refetches for that `queryKey`
    // await queryClient.cancelQueries({ queryKey });
    //       const fiche =
    // },
    onSuccess: ({ id, axes }) => {
      utils.plans.fiches.list.invalidate({
        collectiviteId,
      });
      utils.plans.fiches.listResumes.invalidate({
        collectiviteId,
      });
      utils.indicateurs.list.invalidate({
        collectiviteId,
        filtre: {
          ficheActionIds: [id],
        },
      });

      axes?.forEach(({ id: axeId }) =>
        queryClient.invalidateQueries(['axe_fiches', axeId])
      );
      queryClient.invalidateQueries(['axe_fiches', null]);
      queryClient.invalidateQueries(['structures', collectiviteId]);
      queryClient.invalidateQueries(['partenaires', collectiviteId]);
      queryClient.invalidateQueries(['personnes_pilotes', collectiviteId]);
      queryClient.invalidateQueries(['personnes', collectiviteId]);
      queryClient.invalidateQueries(['services_pilotes', collectiviteId]);
      queryClient.invalidateQueries(['personnes_referentes', collectiviteId]);
      queryClient.invalidateQueries(['financeurs', collectiviteId]);
    },
  });
};
