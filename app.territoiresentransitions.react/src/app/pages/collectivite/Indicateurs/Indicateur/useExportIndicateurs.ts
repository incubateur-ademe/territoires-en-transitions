import { useCurrentCollectivite } from '@/api/collectivites';
import { useApiClient } from '@/app/core-logic/api/useApiClient';
import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { Event, useEventTracker } from '@/ui';
import { useMutation } from 'react-query';
import { TIndicateurListItem } from '../types';

export const useExportIndicateurs = (definitions?: TIndicateurListItem[]) => {
  const trackEvent = useEventTracker();
  const { collectiviteId:   collectiviteId } = useCurrentCollectivite();
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

        trackEvent(Event.indicateurs.downloadXlsx);
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
