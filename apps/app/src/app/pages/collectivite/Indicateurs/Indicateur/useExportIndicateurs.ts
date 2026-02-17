import { sortByItems } from '@/app/app/pages/collectivite/Indicateurs/lists/indicateurs-list/use-indicateurs-list-params';
import {
  IndicateurDefinitionListItem,
  ListDefinitionsInputFilters,
} from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useApiClient } from '@/app/utils/use-api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ListDefinitionsInputSort } from '@tet/domain/indicateurs';
import { Event, useEventTracker } from '@tet/ui';

type UseExportIndicateursInput = {
  definitions?: IndicateurDefinitionListItem[];
  filters?: ListDefinitionsInputFilters;
  count?: number;
  sortBy?: ListDefinitionsInputSort;
};

export const useExportIndicateurs = (
  input: UseExportIndicateursInput | IndicateurDefinitionListItem[]
) => {
  const trackEvent = useEventTracker();
  const { collectiviteId } = useCurrentCollectivite();
  const apiClient = useApiClient();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setToast } = useToastContext();

  // Support de l'ancienne signature (array) pour IndicateurToolbar
  const params: UseExportIndicateursInput = Array.isArray(input)
    ? { definitions: input }
    : input;

  return useMutation({
    mutationKey: ['export_indicateurs', collectiviteId],

    mutationFn: async () => {
      if (!collectiviteId) return;

      let indicateurIds: (string | number)[];

      if (
        params.filters !== undefined &&
        params.count !== undefined &&
        params.count > 0
      ) {
        // Récupérer tous les IDs des indicateurs filtrés (pas seulement la page courante)
        const sort =
          sortByItems.find((s) => s.value === params.sortBy) ?? sortByItems[0];
        const limit = Math.min(params.count, 1000);

        const result = await queryClient.fetchQuery(
          trpc.indicateurs.indicateurs.list.queryOptions({
            collectiviteId,
            filters: params.filters,
            queryOptions: {
              page: 1,
              limit,
              sort: [{ field: sort.value, direction: sort.direction }],
            },
          })
        );

        indicateurIds = result.data.map((d) => d.id);
      } else if (params.definitions?.length) {
        indicateurIds = params.definitions.map((d) => d.id);
      } else {
        return;
      }

      if (!indicateurIds.length) return;

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
