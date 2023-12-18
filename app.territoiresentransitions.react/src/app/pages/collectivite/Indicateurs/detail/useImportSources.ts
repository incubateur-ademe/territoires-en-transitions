import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {naturalSort} from 'utils/naturalSort';

/**
 * Charge la liste des différentes sources de données d'un indicateur
 */
export const useIndicateurImportSources = (indicateur_id: string) => {
  const collectivite_id = useCollectiviteId();
  return useQuery(
    ['indicateur_import_sources', collectivite_id, indicateur_id],
    async () => {
      if (!collectivite_id || !indicateur_id) return;
      const {data} = await supabaseClient
        .from('indicateur_definitions')
        .select('import_sources')
        .match({collectivite_id, indicateur_id})
        .returns<Array<{import_sources: string[]}>>();

      return data?.[0]?.import_sources?.sort(naturalSort) || null;
    }
  );
};
