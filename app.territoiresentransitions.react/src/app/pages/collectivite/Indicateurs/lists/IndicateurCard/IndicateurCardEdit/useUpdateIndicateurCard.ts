import {useMutation} from 'react-query';

import {Indicateurs} from '@tet/api';
import {Personne, Tag, Thematique} from '@tet/api/dist/src/shared/domain';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';

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
