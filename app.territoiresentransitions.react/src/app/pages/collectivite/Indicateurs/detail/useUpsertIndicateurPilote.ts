import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TIndicateurDefinition} from '../types';
import {Personne} from 'ui/DropdownListsTemp/PersonnesDropdown/usePersonneListe';

/** Met à jour les personnes pilotes d'un indicateur */
export const useUpsertIndicateurPilote = (
  definition: TIndicateurDefinition
) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();

  const {id: indicateur_id, isPerso} = definition;

  return useMutation({
    mutationKey: `upsert_indicateur_pilote`,
    mutationFn: async (variables: Personne[]) => {
      if (!collectivite_id) return;

      // supprime les éventuelles ref. vers les users ou tags qui ne sont plus associés à l'indicateur
      const {userIds, tagIds, tagsToAdd} = splitTagsAndUsers(variables);
      const idCol = isPerso ? 'indicateur_perso_id' : 'indicateur_id';
      const query = supabaseClient
        .from('indicateur_pilote')
        .delete()
        .eq(idCol, indicateur_id)
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
        isPerso
          ? {...p, indicateur_perso_id: indicateur_id, indicateur_id: null}
          : {
              ...p,
              collectivite_id,
              indicateur_perso_id: null,
              indicateur_id: indicateur_id as string,
            }
      );

      // ajoute les nouvelles entrées si elles n'existent pas déjà
      return supabaseClient.from('indicateur_pilote').upsert(merged, {
        onConflict:
          'indicateur_id, indicateur_perso_id, collectivite_id, user_id, tag_id',
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
