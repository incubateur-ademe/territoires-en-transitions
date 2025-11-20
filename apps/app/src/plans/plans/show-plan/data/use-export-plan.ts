import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { useApiClient } from '@/app/utils/use-api-client';
import { useMutation } from '@tanstack/react-query';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Event, useEventTracker } from '@tet/ui';

export const useExportPlanAction = (planId: number) => {
  const tracker = useEventTracker();
  const apiClient = useApiClient();
  const collectiviteId = useCollectiviteId();

  return useMutation({
    mutationKey: ['export_plan_action', planId],

    mutationFn: async (format: 'xlsx' | 'docx') => {
      const { blob, filename } = await apiClient.getAsBlob(
        {
          route: '/plan/export',
          params: { collectiviteId, planId, format },
        },
        'POST'
      );

      if (filename && blob) {
        saveBlob(blob, filename);
        tracker(Event.plans.exportPlan, {
          format,
        });
      }
    },

    meta: {
      success: 'Export terminé',
      error: "Échec de l'export",
    },
  });
};
