import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {Personne} from '../../PlansActions/FicheAction/data/types';
import {TIndicateurDefinition} from '../types';

/** Met à jour les personnes pilotes d'un indicateur */
export const useUpsertIndicateurPilote = (
  definition: TIndicateurDefinition
) => {
  const {id, isPerso} = definition;

  const upsertIndicateurPredefiniPilote = useUpsertIndicateurPredefiniPilote(
    id as string
  );
  const upsertIndicateurPersoPilote = useUpsertIndicateurPersoPilote(
    id as number
  );
  return isPerso
    ? upsertIndicateurPersoPilote
    : upsertIndicateurPredefiniPilote;
};

/** Met à jour les personnes pilotes d'un indicateur prédéfini */
const useUpsertIndicateurPredefiniPilote = (indicateur_id: string) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();

  return useMutation({
    mutationKey: `upsert_indicateur_pilote`,
    mutationFn: async (variables: Personne[]) => {
      if (!collectivite_id || !indicateur_id) return;

      // supprime les ref. vers les users ou tags qui ne sont plus associés à l'indicateur
      const {user_ids, tag_ids, somethingToRemove} = toRemove(variables);
      if (somethingToRemove) {
        await supabaseClient
          .from('indicateur_pilote')
          .delete()
          .eq('collectivite_id', collectivite_id)
          .eq('indicateur_id', indicateur_id)
          .or(`user_id.not.in.(${user_ids}), tag_id.not.in.(${tag_ids})`);
      }

      // et ajoute les nouvelles entrées
      return supabaseClient.from('indicateur_pilote').upsert(
        variables.map(({user_id, tag_id}) => ({
          user_id,
          tag_id,
          collectivite_id,
          indicateur_id,
        })),
        {onConflict: 'collectivite_id,indicateur_id,user_id,tag_id'}
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries([
        'indicateur_resume',
        collectivite_id,
        indicateur_id,
      ]);
    },
  });
};

/** Met à jour les personnes pilotes d'un indicateur */
const useUpsertIndicateurPersoPilote = (indicateur_id: number) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();

  return useMutation({
    mutationKey: `indicateur_personnalise_pilote`,
    mutationFn: async (variables: Personne[]) => {
      if (isNaN(indicateur_id)) return;

      // supprime les ref. vers les users ou tags qui ne sont plus associés à l'indicateur
      const {user_ids, tag_ids, somethingToRemove} = toRemove(variables);
      if (somethingToRemove) {
        await supabaseClient
          .from('indicateur_personnalise_pilote')
          .delete()
          .eq('indicateur_id', indicateur_id)
          .or(`user_id.not.in.(${user_ids}), tag_id.not.in.(${tag_ids})`);
      }

      // et ajoute les nouvelles entrées
      return supabaseClient.from('indicateur_personnalise_pilote').upsert(
        variables.map(({user_id, tag_id}) => ({
          user_id,
          tag_id,
          indicateur_id,
        })),
        {onConflict: 'indicateur_id,user_id,tag_id'}
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries([
        'indicateur_resume',
        collectivite_id,
        indicateur_id,
      ]);
    },
  });
};

const toRemove = (variables: Personne[]) => {
  const user_ids = variables
    .map(({user_id}) => user_id)
    .filter(Boolean)
    .join(',');
  const tag_ids = variables
    .map(({tag_id}) => tag_id)
    .filter(Boolean)
    .join(',');
  return {
    user_ids,
    tag_ids,
    somethingToRemove: user_ids.length + tag_ids.length > 0,
  };
};
