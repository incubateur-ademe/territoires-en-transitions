import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {Tables, Views} from 'types/alias';

type TFetchedData = Pick<
  Views<'indicateur_resume'>,
  'pilotes' | 'thematiques'
> & {
  services: Tables<'service_tag'>[] | null;
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
      .from('indicateur_resume')
      .select('pilotes,services,thematiques')
      .match(
        isPerso
          ? {collectivite_id, indicateur_personnalise: id}
          : {collectivite_id, indicateur_referentiel: id}
      )
      .returns<TFetchedData[]>();

    const {data} = await query;
    return data?.[0];
  });
};
