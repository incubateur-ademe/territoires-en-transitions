import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TIndicateurDefinition} from '../types';
import {TablesInsert} from 'types/alias';

type TService = TablesInsert<'service_tag'>;

/** Met à jour les services pilotes d'un indicateur */
export const useUpsertIndicateurServicePilote = (
  definition: TIndicateurDefinition
) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();

  const {id: indicateur_id, isPerso} = definition;

  return useMutation({
    mutationKey: 'upsert_indicateur_service_tag',
    mutationFn: async (variables: TService[]) => {
      if (!collectivite_id) return;

      // supprime les éventuelles ref. vers les tags qui ne sont plus associés à l'indicateur
      const {tagIds, tagsToAdd} = splitTags(variables);
      const query = supabaseClient
        .from('indicateur_service_tag')
        .delete()
        .eq(isPerso ? 'indicateur_perso_id' : 'indicateur_id', indicateur_id)
        .not('service_tag_id', 'in', `(${tagIds.join(',')})`);
      if (!isPerso) {
        query.eq('collectivite_id', collectivite_id);
      }
      await query;

      // ajoute les éventuels nouveaux tags
      const {data: newTags} = await supabaseClient
        .from('service_tag')
        .insert(tagsToAdd.map(t => ({...t, collectivite_id})))
        .select('id');

      // rassemble les ids des nouveaux tags avec les ids existants
      const newTagIds = newTags?.map(({id}) => id) || [];
      const merged = [
        ...tagIds.concat(newTagIds).map(service_tag_id => ({service_tag_id})),
      ].map(p =>
        // et ajoute l'id de l'indicateur (et de la collectivité si nécessaire)
        isPerso
          ? {...p, indicateur_perso_id: indicateur_id}
          : {...p, collectivite_id, indicateur_id: indicateur_id as string}
      );

      // ajoute les nouvelles entrées si elles n'existent pas déjà
      return supabaseClient.from('indicateur_service_tag').upsert(merged, {
        onConflict:
          'indicateur_id, indicateur_perso_id, collectivite_id, service_tag_id',
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
      const {tagsToAdd} = splitTags(variables);
      if (tagsToAdd.length) {
        queryClient.invalidateQueries(['services_pilotes', collectivite_id]);
      }
    },
  });
};

// sépare les ids de tags et les noms des tags à ajouter
const splitTags = (variables: TService[]) =>
  variables.reduce(
    (res, {id, nom}) => {
      if (typeof id === 'number') {
        res.tagIds.push(id);
      } else {
        const n = nom?.trim();
        if (n) {
          res.tagsToAdd.push({nom: n});
        }
      }
      return res;
    },
    {
      tagIds: [],
      tagsToAdd: [],
    } as {tagIds: number[]; tagsToAdd: {nom: string}[]}
  );
