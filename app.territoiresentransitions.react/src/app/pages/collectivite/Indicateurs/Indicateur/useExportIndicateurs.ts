import { useCurrentCollectivite } from '@/app/collectivites/collectivite-context';
import { useApiClient } from '@/app/core-logic/api/useApiClient';
import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { useEventTracker } from '@/ui';
import { useMutation } from 'react-query';
import { TIndicateurListItem } from '../types';

export type ExportIndicateursPageName =
  | 'app/indicateurs/tous'
  | 'app/indicateurs/perso'
  | 'app/indicateurs/predefini'
  | 'app/tdb/personnel/indicateurs-de-suivi-de-mes-plans';

export const useExportIndicateurs = (
  pageName: ExportIndicateursPageName,
  definitions?: TIndicateurListItem[]
) => {
  const trackEvent = useEventTracker(pageName);
  const { collectiviteId, niveauAcces, role } = useCurrentCollectivite();
  const apiClient = useApiClient();

  return useMutation(
    ['export_indicateurs', collectiviteId],
    async () => {
      if (!collectiviteId || !definitions?.length) return;
      const indicateurIds = definitions.map((d) => d.id);
      const { blob, filename } = await apiClient.getAsBlob(
        {
          route: '/indicateur-definitions/xlsx',
          params: { collectiviteId, indicateurIds },
        },
        'POST'
      );

      if (filename && blob) {
        saveBlob(blob, filename);

        trackEvent('export_xlsx_telechargement', {
          collectiviteId,
          niveauAcces,
          role,
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
