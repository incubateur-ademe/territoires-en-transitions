import { useApiClient } from '@/app/utils/use-api-client';
import { Fiche, FicheNote } from '@/domain/plans';
import { useQuery } from '@tanstack/react-query';

/**
 * Charge les notes de suivi d'une fiche action
 */
export const useFicheActionNotesSuivi = (
  { id: ficheId, collectiviteId }: Pick<Fiche, 'id' | 'collectiviteId'>,
  requested = true
) => {
  const api = useApiClient();

  return useQuery({
    queryKey: ['fiche_action_notes_suivi', collectiviteId, ficheId],

    queryFn: async () => {
      if (!collectiviteId || !ficheId) return;
      return api.get<FicheNote[]>({
        route: `/collectivites/${collectiviteId}/fiches-action/${ficheId}/notes`,
      });
    },

    enabled: requested,
  });
};
