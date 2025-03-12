import { useFonctionTracker } from '@/app/core-logic/hooks/useFonctionTracker';
import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { ReferentielId } from '@/domain/referentiels';
import { useMutation } from 'react-query';
import { useApiClient } from '../core-logic/api/useApiClient';

export const useExportScore = (
  referentielId: ReferentielId,
  collectiviteId: number
) => {
  const tracker = useFonctionTracker();
  const apiClient = useApiClient();

  return useMutation(
    ['export_score', collectiviteId, referentielId],
    async () => {
      tracker({
        page: 'referentiel',
        action: 'telechargement',
        fonction: 'export_xlsx',
      });

      const { blob, filename } = await apiClient.getAsBlob({
        route: `/collectivites/${collectiviteId}/referentiels/${referentielId}/score-snapshots/score-courant/export`,
      });

      if (blob) {
        await saveBlob(blob, filename as string);
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
