import { useCollectiviteId } from '@/app/collectivites/collectivite-context';
import { useApiClient } from '@/app/core-logic/api/useApiClient';
import { useFonctionTracker } from '@/app/core-logic/hooks/useFonctionTracker';
import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { useMutation } from 'react-query';

export const useExportPlanAction = (planId: number) => {
  const tracker = useFonctionTracker();
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
        tracker({
          page: 'plan',
          action: 'telechargement',
          fonction: `export_${format}`,
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
