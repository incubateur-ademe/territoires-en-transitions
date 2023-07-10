import {useMutation, useQuery, useQueryClient} from 'react-query';
import {diff} from 'utils/diff';
import {supabaseClient} from 'core-logic/api/supabase';
import {FicheResume} from '../PlansActions/FicheAction/data/types';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TIndicateurDefinition} from './types';

/**
 * Charge la liste des fiches action liées à un indicateur
 */
export const useFichesActionLiees = (definition: TIndicateurDefinition) => {
  const collectivite_id = useCollectiviteId();

  const {id, isPerso} = definition;

  const {data, ...other} = useQuery(
    ['fiche_action_indicateur_lies', collectivite_id, id],
    async () => {
      const {data} = await supabaseClient
        .from('fiche_action_indicateur')
        .select('fiche_resume(*)')
        .eq('fiche_resume.collectivite_id', collectivite_id)
        .match(
          isPerso ? {indicateur_personnalise_id: id} : {indicateur_id: id}
        );
      return (
        data
          // extrait les fiches
          ?.map(({fiche_resume}) => fiche_resume as FicheResume)
          // filtre les fiches non valides
          .filter(fiche => Boolean(fiche))
      );
    }
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
  const collectivite_id = useCollectiviteId();
  const {isPerso, id} = definition;

  return useMutation(
    async ({fiches, fiches_liees}: TUpdateFichesActionLieesArgs) => {
      // extrait les ids des listes
      const current_ids = fiches.map(f => f.id);
      const new_ids = fiches_liees.map(f => f.id);
      // extrait les ids des fiches à ajouter ou supprimer
      const idsToDelete = diff(current_ids, new_ids);
      const idsToAdd = diff(new_ids, current_ids);

      // supprime les anciennes entrées
      if (idsToDelete.length) {
        const query = supabaseClient
          .from('fiche_action_indicateur')
          .delete()
          .match({fiche_id: idsToDelete});

        if (isPerso) {
          query.eq('indicateur_personnalise_id', id);
        } else {
          query.eq('indicateur_id', id);
        }
        await query;
      }

      // et ajoute les nouvelles
      if (idsToAdd.length) {
        const matchId = isPerso
          ? {indicateur_id: null, indicateur_personnalise_id: id as number}
          : {indicateur_id: id as string, indicateur_personnalise_id: null};

        const toAdd = idsToAdd.map(fiche_id => ({
          fiche_id: fiche_id!,
          ...matchId,
        }));
        await supabaseClient.from('fiche_action_indicateur').insert(toAdd);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([
          'fiche_action_indicateur_lies',
          collectivite_id,
          id,
        ]);
      },
    }
  );
};

type TUpdateFichesActionLieesArgs = {
  /** liste courante des fiches associées à l'indicateur */
  fiches: FicheResume[];
  /** liste mise à jour des fiches associées à l'indicateur */
  fiches_liees: FicheResume[];
};
