import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {CompositeTypes, Tables} from '@tet/api';

type TFetchedData = {
  pilotes: CompositeTypes<'personne'>[];
  services: Tables<'service_tag'>[];
  thematiques: Tables<'thematique'>[];
  confidentiel: boolean;
};

/**
 * Charge les informations complémentaires (pilotes, etc.) associées à un indicateur.
 * Cette requête est invalidée lorsque les infos sont éditéées par l'utilisateur.
 */
export const useIndicateurInfoLiees = ({
  id,
  isPerso,
}: {
  id: number | string | undefined;
  isPerso?: boolean;
}) => {
  const collectivite_id = useCollectiviteId();
  return useQuery(['indicateur_info_liees', collectivite_id, id], async () => {
    if (collectivite_id === undefined || id === undefined) return;

    const query = supabaseClient
      .from('indicateur_definitions')
      .select(
        'pilotes(tag_id,user_id),services(id:service_tag_id),thematiques(id), confidentiel'
      )
      .match(
        isPerso
          ? {indicateur_perso_id: id}
          : {collectivite_id, indicateur_id: id}
      )
      .returns<TFetchedData[]>();

    const {data} = await query;
    return data?.[0];
  });
};
