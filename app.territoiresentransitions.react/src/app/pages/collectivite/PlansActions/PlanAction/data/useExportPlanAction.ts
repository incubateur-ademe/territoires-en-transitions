import { useCollectiviteId } from '@/api/collectivites';
import { useApiClient } from '@/app/core-logic/api/useApiClient';
import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { Event, useEventTracker } from '@/ui';
import { useMutation } from 'react-query';

export const useExportPlanAction = (planId: number) => {
  const tracker = useEventTracker();
  const apiClient = useApiClient();
  const collectiviteId = useCollectiviteId();

  return useMutation(
    ['export_plan_action', planId],
    async (format: 'xlsx' | 'docx') => {
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
    {
      meta: {
        success: 'Export terminé',
        error: "Échec de l'export",
      },
    }
  );
};
