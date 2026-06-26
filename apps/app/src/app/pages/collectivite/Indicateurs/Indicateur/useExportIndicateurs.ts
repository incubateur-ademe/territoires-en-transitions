import { ListDefinitionsInputFilters } from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { appLabels } from '@/app/labels/catalog';
import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useApiClient } from '@/app/utils/use-api-client';
import { useMutation } from '@tanstack/react-query';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ListDefinitionsInputSort } from '@tet/domain/indicateurs';
import { Event, useEventTracker } from '@tet/ui';

type SortItem = { field: ListDefinitionsInputSort; direction: 'asc' | 'desc' };

export type ExportIndicateursInput =
  | { mode: 'selection'; indicateurIds: number[] }
  | { mode: 'all'; filters?: ListDefinitionsInputFilters; sort?: SortItem[] };

export const useExportIndicateurs = (input: ExportIndicateursInput) => {
  const trackEvent = useEventTracker();
  const { collectiviteId } = useCurrentCollectivite();
  const apiClient = useApiClient();
  const { setToast } = useToastContext();

  return useMutation({
    mutationKey: ['export_indicateurs', collectiviteId],

    mutationFn: async () => {
      if (!collectiviteId) return;
      if (input.mode === 'selection' && !input.indicateurIds.length) return;

      const params =
        input.mode === 'selection'
          ? {
              mode: 'selection' as const,
              collectiviteId,
              indicateurIds: input.indicateurIds,
            }
          : {
              mode: 'all' as const,
              collectiviteId,
              filters: input.filters,
              sort: input.sort,
            };

      try {
        const { blob, filename } = await apiClient.getAsBlob(
          { route: '/indicateur-definitions/xlsx', params },
          'POST'
        );

        if (blob) {
          saveBlob(blob, filename || 'export-indicateur.xlsx');
          trackEvent(Event.indicateurs.downloadXlsx);
          setToast('success', appLabels.exportTermine);
        } else {
          throw new Error();
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setToast('error', appLabels.exportEchec);
      }
    },
  });
};
