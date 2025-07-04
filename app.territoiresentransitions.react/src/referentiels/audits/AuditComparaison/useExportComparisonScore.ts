import { useApiClient } from '@/app/core-logic/api/useApiClient';
import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { Event, useEventTracker } from '@/ui';
import { useMutation } from 'react-query';

type ExportFormat = 'excel' | 'csv';

const buildParams = (
  exportFormat: ExportFormat,
  isAudit: boolean,
  snapshotReferences?: string[]
) => {
  const params: Record<string, any> = {
    exportFormat,
    isAudit,
  };
  if (snapshotReferences) {
    params.snapshotReferences = snapshotReferences.join(',');
  }
  return params;
};

export const useExportComparisonScores = (
  referentiel: string,
  collectiviteId: number,
  exportFormat: ExportFormat,
  isAudit: boolean,
  snapshotReferences?: string[]
) => {
  const tracker = useEventTracker();
  const api = useApiClient();

  const isSingleExport = snapshotReferences?.length === 1;

  return useMutation(
    async () => {
      if (!collectiviteId || !referentiel) return;

      if (isAudit) {
        tracker(Event.referentiels.exportAuditScore);
      } else if (isSingleExport) {
        tracker(Event.referentiels.exportSingleSnapshotScore);
      } else {
        tracker(Event.referentiels.exportComparisonScore);
      }

      const params = buildParams(exportFormat, isAudit, snapshotReferences);

      const { blob, filename } = await api.getAsBlob({
        route: `/collectivites/${collectiviteId}/referentiels/${referentiel}/score-snapshots/export-comparison`,
        params,
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
