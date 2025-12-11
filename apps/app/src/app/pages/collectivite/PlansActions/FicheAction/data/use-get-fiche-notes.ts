import { useApiClient } from '@/app/utils/use-api-client';
import { useQuery } from '@tanstack/react-query';
import { Fiche, FicheNote } from '@tet/domain/plans';

export const useGetFicheNotes = (
  { id: ficheId, collectiviteId }: Pick<Fiche, 'id' | 'collectiviteId'>,
  requested = true
) => {
  const api = useApiClient();

  return useQuery({
    queryKey: ['fiche_action_notes', collectiviteId, ficheId],

    queryFn: async () => {
      if (!collectiviteId || !ficheId) return;
      return api.get<FicheNote[]>({
        route: `/collectivites/${collectiviteId}/fiches-action/${ficheId}/notes`,
      });
    },

    enabled: requested,
  });
};
