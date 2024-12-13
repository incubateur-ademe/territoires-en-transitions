import { useApiClient } from '@/app/core-logic/api/useApiClient';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { DOWNLOAD_FILE_MUTATION_OPTIONS } from '@/app/utils/useDownloadFile';
import { useEventTracker } from '@/ui';
import { useMutation } from 'react-query';
import { saveBlob } from 'ui/shared/preuves/Bibliotheque/saveBlob';

/** Télécharge le fichier xlsx modèle */
export const useTelechargementModele = () => {
  const api = useApiClient();
  const trackEvent = useEventTracker('app/trajectoires/snbc');
  const collectivite_id = useCollectiviteId()!;

  return useMutation(
    'snbc/modele',
    async () => {
      trackEvent('cta_download', { collectivite_id, file: 'modele' });
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
