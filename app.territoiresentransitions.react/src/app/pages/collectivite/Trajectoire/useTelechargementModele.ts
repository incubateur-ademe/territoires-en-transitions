import { useApiClient } from '@/app/core-logic/api/useApiClient';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { saveBlob } from '@/app/ui/shared/preuves/Bibliotheque/saveBlob';
import { DOWNLOAD_FILE_MUTATION_OPTIONS } from '@/app/utils/useDownloadFile';
import { useEventTracker } from '@/ui';
import { useMutation } from 'react-query';

/** Télécharge le fichier xlsx modèle */
export const useTelechargementModele = () => {
  const api = useApiClient();
  const trackEvent = useEventTracker('app/trajectoires/snbc');
  const { collectiviteId, niveauAcces, role } = useCurrentCollectivite()!;

  return useMutation(
    'snbc/modele',
    async () => {
      trackEvent('cta_download', {
        collectiviteId,
        niveauAcces,
        role,
        file: 'modele',
      });
      const { blob, filename } = await api.getAsBlob({
        route: '/trajectoires/snbc/modele',
      });
      if (blob) {
        await saveBlob(blob, filename || `Trajectoire SNBC - modèle.xlsx`);
      }
    },
    DOWNLOAD_FILE_MUTATION_OPTIONS
  );
};
