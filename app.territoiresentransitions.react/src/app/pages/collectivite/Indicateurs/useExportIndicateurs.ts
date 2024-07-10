import {useMutation} from 'react-query';
import {format as formatDate} from 'date-fns';
import {supabaseClient} from 'core-logic/api/supabase';
import {useFonctionTracker} from 'core-logic/hooks/useFonctionTracker';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {saveBlob} from 'ui/shared/preuves/Bibliotheque/saveBlob';
import {TIndicateurListItem} from './types';
import {IndicateurViewParamOption} from 'app/paths';

export const useExportIndicateurs = (
  definitions?: TIndicateurListItem[],
  view?: IndicateurViewParamOption
) => {
  const tracker = useFonctionTracker();
  const collectivite_id = useCollectiviteId();
  const filename = useFilename(definitions, view);

  return useMutation(
    ['export_indicateurs', collectivite_id],
    async () => {
      if (!collectivite_id || !definitions?.length) return;
      const indicateur_ids = definitions.map(d => d.id);
      const {data} = await supabaseClient.functions.invoke(
        'export_indicateur',
        {
          body: {collectivite_id, indicateur_ids},
        }
      );

      if (filename && data) {
        saveBlob(data, filename);

        tracker({
          page: 'indicateur',
          action: 'telechargement',
          fonction: 'export_xlsx',
        });
      }
    },
    {
      meta: {
        success: 'Export terminé',
        error: "Échec de l'export",
      },
    }
  );
};

// détermine le nom du fichier généré
const useFilename = (
  definitions?: TIndicateurListItem[],
  view?: IndicateurViewParamOption
) => {
  const exportedAt = formatDate(new Date(), 'yyyy-MM-dd');

  if (!definitions?.length) return;

  if (definitions.length > 1) {
    return `Export indicateurs ${view ? `${view} ` : ''}- ${exportedAt}.zip`;
  }

  if (definitions.length === 1) {
    const def = definitions[0];
    if (typeof def.id === 'number') {
      return `${def.titre} - ${exportedAt}.xlsx`;
    }
    return `${def.id} - ${def.titre} - ${exportedAt}.xlsx`;
  }
};
