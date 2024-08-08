import {useMutation, useQuery, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TIndicateurDefinition} from '../../types';
import {Indicateurs, SharedDomain} from '@tet/api';

/** Met à jour les services pilotes d'un indicateur */
export const useUpsertIndicateurServices = (
  definition: TIndicateurDefinition
) => {
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId();

  const {id: indicateurId} = definition;

  return useMutation({
    mutationKey: 'upsert_indicateur_services',
    mutationFn: async (services: SharedDomain.Tag[]) => {
      if (!collectiviteId) return;
      return Indicateurs.save.upsertServices(
        supabaseClient,
        definition,
        collectiviteId,
        services
      );
    },
    onSuccess: (data, variables) => {
      // recharge les infos complémentaires associées à l'indicateur
      queryClient.invalidateQueries([
        'indicateur_services',
        collectiviteId,
        indicateurId,
      ]);
      queryClient.invalidateQueries(['services_pilotes', collectiviteId]);
    },
  });
};

/** Charge les services pilotes d'un indicateur */
export const useIndicateurServices = (definition: TIndicateurDefinition) => {
  const collectiviteId = useCollectiviteId();

  const {id: indicateurId} = definition;

  return useQuery(
    ['indicateur_services', collectiviteId, indicateurId],
    async () => {
      if (!collectiviteId) return;
      return Indicateurs.fetch.selectIndicateurServices(
        supabaseClient,
        definition.id,
        collectiviteId
      );
    }
  );
};
