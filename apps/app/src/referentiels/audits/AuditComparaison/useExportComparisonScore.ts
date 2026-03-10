import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { useApiClient } from '@/app/utils/use-api-client';
import { useMutation } from '@tanstack/react-query';
import { Event, useEventTracker } from '@tet/ui';

type ExportFormat = 'excel' | 'csv';

const buildParams = (
  exportFormat: ExportFormat,
  isAudit: boolean,
  snapshotReferences?: string[]
) => {
  const params: Record<string, string | boolean | undefined> = {
    exportFormat,
    isAudit,
  };
  if (snapshotReferences) {
    params.snapshotReferences = snapshotReferences.join(',');
  }
  return params;
};

const getTrackingEvent = (isAudit: boolean, snapshotReferences?: string[]) => {
  if (isAudit) {
    return Event.referentiels.exportAuditScore;
  }

  const isSingleExport = snapshotReferences?.length === 1;

  if (isSingleExport) {
    const isCurrentScore = snapshotReferences?.includes('score-courant');
    return isCurrentScore
      ? Event.referentiels.exportCurrentScore
      : Event.referentiels.exportSingleSnapshotScore;
  }

  return Event.referentiels.exportComparisonScore;
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

  return useMutation({
    mutationFn: async () => {
      if (!collectiviteId || !referentiel) return;

      const trackingEvent = getTrackingEvent(isAudit, snapshotReferences);
      tracker(trackingEvent);

      const params = buildParams(exportFormat, isAudit, snapshotReferences);

      const { blob, filename } = await api.getAsBlob({
        route: `/collectivites/${collectiviteId}/referentiels/${referentiel}/score-snapshots/export-comparison`,
        params,
      });

      await saveBlob(blob, filename as string);
    },
    meta: {
      success: 'Export terminé',
      error: "Échec de l'export",
    },
  });
};
