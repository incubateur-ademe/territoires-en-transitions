import { useApiClient } from '@/app/core-logic/api/useApiClient';
import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { Event, useEventTracker } from '@/ui';
import { useMutation } from 'react-query';

export const useExportComparisonScores = (
  referentiel: string,
  collectiviteId: number,
  isAudit: boolean,
  snapshotReferences?: string[]
) => {
  const tracker = useEventTracker();
  const api = useApiClient();

  return useMutation(
    async () => {
      if (!collectiviteId || !referentiel) return;

      if (isAudit) {
        tracker(Event.referentiels.exportAuditScore);
      } else {
        tracker(Event.referentiels.exportComparisonScore);
      }

      const { blob, filename } = await api.getAsBlob({
        route: `/collectivites/${collectiviteId}/referentiels/${referentiel}/score-snapshots/export-comparison`,
        params: {
          isAudit,
          // TEMPO HACK (just snapshotReferences initially)
          ...(snapshotReferences && { snapshotReferences }),
        },
      });

      await saveBlob(blob, filename as string);
    },
    {
      meta: {
        success: 'Export terminé',
        error: "Échec de l'export",
      },
    }
  );
};
