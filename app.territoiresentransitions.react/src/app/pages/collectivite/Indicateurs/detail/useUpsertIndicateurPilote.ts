import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {Personne} from '../../PlansActions/FicheAction/data/types';
import {TIndicateurDefinition} from '../types';

/** Met à jour les personnes pilotes d'un indicateur */
export const useUpsertIndicateurPilote = (
  definition: TIndicateurDefinition
) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();

  const {id: indicateur_id, isPerso} = definition;
  const table = isPerso
    ? 'indicateur_personnalise_pilote'
    : 'indicateur_pilote';

  return useMutation({
    mutationKey: `upsert_${table}`,
    mutationFn: async (variables: Personne[]) => {
      if (!collectivite_id) return;

      // supprime les éventuelles ref. vers les users ou tags qui ne sont plus associés à l'indicateur
      const {userIds, tagIds, tagsToAdd} = splitTagsAndUsers(variables);
      const query = supabaseClient
        .from(table)
        .delete()
        .eq('indicateur_id', indicateur_id)
        .or(
          `user_id.not.in.(${userIds.join(',')}), tag_id.not.in.(${tagIds.join(
            ','
          )})`
        );
      if (!isPerso) {
        query.eq('collectivite_id', collectivite_id);
      }
      await query;

      // ajoute les éventuels nouveaux tags
      const {data: newTags} = await supabaseClient
        .from('personne_tag')
        .insert(tagsToAdd.map(t => ({...t, collectivite_id})))
        .select('id');

      // rassemble les ids des nouveaux tags avec les autres ids (users et tags)
      const newTagIds = newTags?.map(({id}) => id) || [];
      const merged = [
        ...userIds.map(user_id => ({user_id, tag_id: null})),
        ...tagIds.concat(newTagIds).map(tag_id => ({user_id: null, tag_id})),
      ].map(p =>
        // et ajoute l'id de l'indicateur (et de la collectivité si nécessaire)
        isPerso ? {...p, indicateur_id} : {...p, collectivite_id, indicateur_id}
      );

      // ajoute les nouvelles entrées si elles n'existent pas déjà
      return supabaseClient.from(table).upsert(merged, {
        onConflict: `${
          isPerso ? '' : 'collectivite_id,'
        }indicateur_id,user_id,tag_id`,
      });
    },
    onSuccess: (data, variables) => {
      // recharge les infos complémentaires associées à l'indicateur
      queryClient.invalidateQueries([
        'indicateur_info_liees',
        collectivite_id,
        indicateur_id,
      ]);
      // si on a ajouté un tag il faut aussi rafraichir la liste déroulante
      const {tagsToAdd} = splitTagsAndUsers(variables);
      if (tagsToAdd.length) {
        queryClient.invalidateQueries(['personnes', collectivite_id]);
      }
    },
  });
};

// sépare les id d'utilisateurs, les ids de tags et les noms des tags à ajouter
const splitTagsAndUsers = (variables: Personne[]) =>
  variables.reduce(
    (res, {user_id, tag_id, nom}) => {
      if (user_id) {
        res.userIds.push(user_id);
      } else if (typeof tag_id === 'number') {
        res.tagIds.push(tag_id);
      } else {
        const n = nom?.trim();
        if (n) {
          res.tagsToAdd.push({nom: n});
        }
      }
      return res;
    },
    {
      userIds: [],
      tagIds: [],
      tagsToAdd: [],
    } as {userIds: string[]; tagIds: number[]; tagsToAdd: {nom: string}[]}
  );
