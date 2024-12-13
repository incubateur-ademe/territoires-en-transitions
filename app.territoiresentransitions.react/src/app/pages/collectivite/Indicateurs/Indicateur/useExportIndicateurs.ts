import { useApiClient } from '@/app/core-logic/api/useApiClient';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { useEventTracker } from '@/ui';
import { useMutation } from 'react-query';
import { saveBlob } from 'ui/shared/preuves/Bibliotheque/saveBlob';
import { TIndicateurListItem } from '../types';

export type ExportIndicateursPageName =
  | 'app/indicateurs/tous'
  | 'app/indicateurs/collectivite'
  | 'app/indicateurs/perso'
  | 'app/indicateurs/predefini'
  | 'app/tdb/personnel/indicateurs-de-suivi-de-mes-plans';

export const useExportIndicateurs = (
  pageName: ExportIndicateursPageName,
  definitions?: TIndicateurListItem[]
) => {
  const trackEvent = useEventTracker(pageName);
  const collectiviteId = useCollectiviteId();
  const apiClient = useApiClient();

  return useMutation(
    ['export_indicateurs', collectiviteId],
    async () => {
      if (!collectiviteId || !definitions?.length) return;
      const indicateurIds = definitions.map((d) => d.id);
      const { blob, filename } = await apiClient.getAsBlob(
        {
          route: '/indicateurs/xlsx',
          params: { collectiviteId, indicateurIds },
        },
        'POST'
      );

      if (filename && blob) {
        saveBlob(blob, filename);

        trackEvent('export_xlsx_telechargement', {
          collectivite_id: collectiviteId,
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
