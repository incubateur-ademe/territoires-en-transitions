import {useMutation, useQuery, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TIndicateurDefinition} from '../types';
import {Indicateurs, SharedDomain} from '@tet/api';

/** Met à jour les personnes pilotes d'un indicateur */
export const useUpsertIndicateurPilote = (
  definition: TIndicateurDefinition
) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();

  const {id: indicateur_id} = definition;

  return useMutation({
    mutationKey: `upsert_indicateur_pilotes`,
    mutationFn: async (pilotes: SharedDomain.Personne[]) => {
      if (!collectivite_id) return;
      return Indicateurs.save.upsertPilotes(
        supabaseClient,
        definition,
        collectivite_id,
        pilotes
      );
    },
    onSuccess: (data, variables) => {
      // recharge les infos complémentaires associées à l'indicateur
      queryClient.invalidateQueries([
        'indicateur_pilotes',
        collectivite_id,
        indicateur_id,
      ]);
      queryClient.invalidateQueries(['personnes', collectivite_id]);
    },
  });
};

/** Charge les personnes pilotes d'un indicateur */
export const useIndicateurPilotes = (definition: TIndicateurDefinition) => {
  const collectivite_id = useCollectiviteId();

  const {id: indicateur_id} = definition;

  return useQuery(
    ['indicateur_pilotes', collectivite_id, indicateur_id],
    async () => {
      if (!collectivite_id) return;
      return Indicateurs.fetch.selectIndicateurPilotes(
        supabaseClient,
        definition.id,
        collectivite_id
      );
    }
  );
};
