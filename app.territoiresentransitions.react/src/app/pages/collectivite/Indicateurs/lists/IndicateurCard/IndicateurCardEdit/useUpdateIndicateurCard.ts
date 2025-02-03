import { Indicateurs } from '@/api';
import { Personne } from '@/api/collectivites';
import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { Tag } from '@/domain/collectivites';
import { Thematique } from '@/domain/shared';
import { useMutation } from 'react-query';

/** Met à jour les pilotes, les services pilotes, les thématique d'un indicateur */
export const useUpdateIndicateurCard = (
  indicateurId: number,
  estPerso: boolean
) => {
  const collectiviteId = useCollectiviteId();

  return useMutation({
    mutationKey: 'update_indicateur_card',
    mutationFn: async ({
      pilotes,
      services,
      thematiques,
    }: {
      pilotes: Personne[];
      services: Tag[];
      thematiques: Thematique[];
    }) => {
      if (!collectiviteId) return;
      return Indicateurs.save.updateIndicateurCard(
        supabaseClient,
        {
          id: indicateurId,
          estPerso,
        },
        collectiviteId,
        pilotes,
        services,
        thematiques
      );
    },
  });
};
