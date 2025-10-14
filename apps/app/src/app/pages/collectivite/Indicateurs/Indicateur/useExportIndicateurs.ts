import { useCurrentCollectivite } from '@/api/collectivites';
import { IndicateurDefinitionListItem } from '@/app/indicateurs/definitions/use-list-indicateur-definitions';
import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { useApiClient } from '@/app/utils/use-api-client';
import { Event, useEventTracker } from '@/ui';
import { useMutation } from '@tanstack/react-query';

export const useExportIndicateurs = (
  definitions?: IndicateurDefinitionListItem[]
) => {
  const trackEvent = useEventTracker();
  const { collectiviteId: collectiviteId } = useCurrentCollectivite();
  const apiClient = useApiClient();

  return useMutation({
    mutationKey: ['export_indicateurs', collectiviteId],

    mutationFn: async () => {
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

    meta: {
      success: 'Export terminé',
      error: "Échec de l'export",
    },
  });
};
