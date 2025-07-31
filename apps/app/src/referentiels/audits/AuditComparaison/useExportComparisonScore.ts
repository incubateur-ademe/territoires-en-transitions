import { useApiClient } from '@/app/core-logic/api/useApiClient';
import { useIsScoreIndicatifEnabled } from '@/app/referentiels/comparisons/use-is-score-indicatif-enabled';
import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { Event, useEventTracker } from '@/ui';
import { useMutation } from '@tanstack/react-query';

type ExportFormat = 'excel' | 'csv';

const buildParams = (
  exportFormat: ExportFormat,
  isAudit: boolean,
  snapshotReferences?: string[],
  isScoreIndicatifEnabled?: boolean
) => {
  const params: Record<string, string | boolean | undefined> = {
    exportFormat,
    isAudit,
    isScoreIndicatifEnabled,
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
  const isScoreIndicatifEnabled = useIsScoreIndicatifEnabled();

  return useMutation({
    mutationFn: async () => {
      if (!collectiviteId || !referentiel) return;

      const trackingEvent = getTrackingEvent(isAudit, snapshotReferences);
      tracker(trackingEvent);

      const params = buildParams(exportFormat, isAudit, snapshotReferences);
      if (isScoreIndicatifEnabled) {
        params.isScoreIndicatifEnabled = true;
      }

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
