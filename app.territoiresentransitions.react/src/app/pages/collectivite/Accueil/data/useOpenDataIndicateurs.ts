import { supabaseClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { useQuery } from 'react-query';

export const useOpenDataIndicateurs = () => {
  const collectiviteId = useCollectiviteId();

  return useQuery(['open_data_indicateurs', collectiviteId], () => {
    if (!collectiviteId) return;
    return fetchOpenDataIndicateurs(collectiviteId);
  });
};

const fetchOpenDataIndicateurs = async (collectivite_id: number) => {
  const { error, data } = await supabaseClient.from('indicateur_valeur').select(
    `indicateur_id,
      indicateur_categorie_tag!inner(categorie_tag_id)`
  ); // Joindre les tables avec !inner pour l'équivalent du join
  //   .select(
  //   `
  //     indicateur_id,
  //     metadonnee_id,
  //     indicateur_categorie_tag!inner(categorie_tag_id),
  //     categorie_tag!inner(nom)
  //   `
  // )
  // .eq('categorie_tag.nom', 'cae') // Filtrer par 'cae' ou 'eci'
  // .eq('collectivite_id', collectivite_id) // Filtrer par collectivite_id
  // .not('metadonnee_id', 'is', null);

  const { error: tagError, data: categorieTags } = await supabaseClient
    .from('indicateur_categorie_tag')
    .select('indicateur_id, categorie_tag_id');

  console.log('coucou');
  console.log(data);
  console.log('cat');
  console.log(categorieTags);

  if (error) throw new Error(error.message);

  return data;
};
