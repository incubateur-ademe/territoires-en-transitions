import {useMutation, useQuery, useQueryClient} from 'react-query';
import {Indicateurs} from '@tet/api';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TIndicateurDefinition} from './types';

/**
 * Charge la liste des fiches action liées à un indicateur
 */
export const useFichesActionLiees = (definition: TIndicateurDefinition) => {
  const collectiviteId = useCollectiviteId()!;

  const {id} = definition;

  const {data, ...other} = useQuery(
    ['fiche_action_indicateur_lies', collectiviteId, id],
    async () =>
      Indicateurs.fetch.selectIndicateurFiches(
        supabaseClient,
        id,
        collectiviteId
      )
  );
  return {data: data || [], ...other};
};

/**
 * Met à jour la liste des fiches action liées à un indicateur
 */
export const useUpdateFichesActionLiees = (
  definition: TIndicateurDefinition
) => {
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId();
  const {id} = definition;

  return useMutation(
    async (fiches_liees: number[]) =>
      Indicateurs.save.upsertFiches(
        supabaseClient,
        id,
        collectiviteId!,
        fiches_liees
      ),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([
          'fiche_action_indicateur_lies',
          collectiviteId,
          id,
        ]);
      },
    }
  );
};
