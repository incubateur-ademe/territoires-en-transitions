import { useApiClient } from '@/app/core-logic/api/useApiClient';
import { CurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { Event, useEventTracker } from '@/ui';
import { useMutation } from 'react-query';

export const useExportAuditScores = (
  referentiel: string | null,
  collectivite: CurrentCollectivite | null
) => {
  const tracker = useEventTracker();
  const api = useApiClient();

  const collectivite_id = collectivite?.collectiviteId;

  return useMutation(
    async () => {
      if (!collectivite_id || !referentiel) return;

      tracker(Event.referentiels.exportAuditScore);

      const { blob, filename } = await api.getAsBlob({
        route: `/collectivites/${collectivite_id}/referentiels/${referentiel}/score-snapshots/export-comparaison/audit`,
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
