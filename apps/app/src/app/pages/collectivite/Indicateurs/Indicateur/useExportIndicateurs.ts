import { IndicateurDefinitionListItem } from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useApiClient } from '@/app/utils/use-api-client';
import { useMutation } from '@tanstack/react-query';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Event, useEventTracker } from '@tet/ui';

export const useExportIndicateurs = (
  definitions?: IndicateurDefinitionListItem[]
) => {
  const trackEvent = useEventTracker();
  const { collectiviteId } = useCurrentCollectivite();
  const apiClient = useApiClient();
  const { setToast } = useToastContext();

  return useMutation({
    mutationKey: ['export_indicateurs', collectiviteId],

    mutationFn: async () => {
      if (!collectiviteId || !definitions?.length) return;
      const indicateurIds = definitions.map((d) => d.id);
      try {
        const { blob, filename } = await apiClient.getAsBlob(
          {
            route: '/indicateur-definitions/xlsx',
            params: { collectiviteId, indicateurIds },
          },
          'POST'
        );

        if (blob) {
          saveBlob(blob, filename || 'export-indicateur.xlsx');
          trackEvent(Event.indicateurs.downloadXlsx);
          setToast('success', 'Export terminé');
        } else {
          throw new Error();
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setToast('error', "Échec de l'export");
      }
    },
  });
};
