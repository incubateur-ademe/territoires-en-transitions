import { FicheAction } from '@/api/plan-actions';
import { useApiClient } from '@/app/core-logic/api/useApiClient';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { useMutation, useQueryClient } from 'react-query';

export const useUpdateFicheAction = () => {
  const collectiviteId = useCollectiviteId();
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation(
    async (fiche: FicheAction) => {
      const { dateFinProvisoire, ...rest } = fiche;

      return collectiviteId
        ? api.put<any>({
            route: `/collectivites/${collectiviteId}/fiches-action/${fiche.id}`,
            params: { dateFin: dateFinProvisoire, ...rest },
          })
        : null;
    },
    {
      mutationKey: 'edit_fiche',
      onSuccess: ({ id, axes }) => {
        queryClient.invalidateQueries(['fiche_action', id?.toString()]);
        axes?.forEach((axe: { id: string }) =>
          queryClient.invalidateQueries(['axe_fiches', axe.id])
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
    }
  );
};
