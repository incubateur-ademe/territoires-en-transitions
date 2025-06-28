import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { ReferentielId } from '@/domain/referentiels';
import { Event, useEventTracker } from '@/ui';
import { useMutation } from '@tanstack/react-query';
import { useApiClient } from '../core-logic/api/useApiClient';

export const useExportScore = (
  referentielId: ReferentielId,
  collectiviteId: number
) => {
  const tracker = useEventTracker();
  const apiClient = useApiClient();

  return useMutation({
    mutationKey: ['export_score', collectiviteId, referentielId],

    mutationFn: async () => {
      tracker(Event.referentiels.exportScore);

      const { blob, filename } = await apiClient.getAsBlob({
        route: `/collectivites/${collectiviteId}/referentiels/${referentielId}/score-snapshots/export/score-courant`,
      });

      if (blob) {
        await saveBlob(blob, filename as string);
      }
    },

    meta: {
      success: 'Export terminé',
      error: "Échec de l'export",
    },
  });
};
