import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {Tables} from 'types/alias';

type TFetchedData = {
  pilotes: Tables<'personne_tag'>[];
  services: Tables<'service_tag'>[];
  thematiques: Tables<'thematique'>[];
};

/** Charge les informations complémentaires (pilotes, etc.) associées à un indicateur */
export const useIndicateurResume = ({
  id,
  isPerso,
}: {
  id: number | string | undefined;
  isPerso?: boolean;
}) => {
  const collectivite_id = useCollectiviteId();
  return useQuery(['indicateur_resume', collectivite_id, id], async () => {
    if (collectivite_id === undefined || id === undefined) return;

    const query = supabaseClient
      .from('indicateur_definitions')
      .select('pilotes,services,thematiques')
      .match(
        isPerso
          ? {collectivite_id, indicateur_perso_id: id}
          : {collectivite_id, indicateur_id: id}
      )
      .returns<TFetchedData[]>();

    const {data} = await query;
    return data?.[0];
  });
};
