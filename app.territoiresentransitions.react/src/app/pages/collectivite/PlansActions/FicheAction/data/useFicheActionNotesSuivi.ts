import { FicheAction, FicheActionNote } from '@/api/plan-actions';
import { useApiClient } from '@/app/core-logic/api/useApiClient';
import { useQuery } from 'react-query';

/**
 * Charge les notes de suivi d'une fiche action
 */
export const useFicheActionNotesSuivi = ({
  id: ficheId,
  collectiviteId,
}: Pick<FicheAction, 'id' | 'collectiviteId'>) => {
  const api = useApiClient();

  return useQuery(
    ['fiche_action_notes_suivi', collectiviteId, ficheId],
    async () => {
      if (!collectiviteId || !ficheId) return;
      return api.get<FicheActionNote[]>({
        route: `/collectivites/${collectiviteId}/fiches-action/${ficheId}/notes`,
      });
    }
  );
};
