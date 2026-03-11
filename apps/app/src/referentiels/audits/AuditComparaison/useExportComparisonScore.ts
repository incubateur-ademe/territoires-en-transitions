import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { useApiClient } from '@/app/utils/use-api-client';
import { useMutation } from '@tanstack/react-query';
import { ExportScoreComparisonRequestQuery } from '@tet/domain/referentiels';
import { Event, useEventTracker } from '@tet/ui';
import { useReferentielTeEnabled } from '../../use-referentiel-te-enabled';

type ExportFormat = 'excel' | 'csv';

const buildParams = (
  exportFormat: ExportFormat,
  isAudit: boolean,
  referentielTeEnabled: boolean,
  snapshotReferences?: string[]
) => {
  const params: ExportScoreComparisonRequestQuery = {
    exportFormat,
    isAudit,
    excludeDesactive: referentielTeEnabled,
  };
  if (snapshotReferences) {
    // @ts-ignore: query parameters are stringified
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
  const referentielTeEnabled = useReferentielTeEnabled();

  return useMutation({
    mutationFn: async () => {
      if (!collectiviteId || !referentiel) return;

      const trackingEvent = getTrackingEvent(isAudit, snapshotReferences);
      tracker(trackingEvent);

      const params = buildParams(
        exportFormat,
        isAudit,
        referentielTeEnabled,
        snapshotReferences
      );

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
