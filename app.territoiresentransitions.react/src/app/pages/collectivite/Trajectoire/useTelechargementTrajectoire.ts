import { useApiClient } from '@/app/core-logic/api/useApiClient';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { saveBlob } from '@/app/ui/shared/preuves/Bibliotheque/saveBlob';
import { DOWNLOAD_FILE_MUTATION_OPTIONS } from '@/app/utils/useDownloadFile';
import { useEventTracker } from '@/ui';
import { useMutation } from 'react-query';

/** Télécharge le fichier xlsx de la trajectoire */
export const useTelechargementTrajectoire = () => {
  const {
    collectiviteId,
    niveauAcces,
    role,
    nom: collectiviteName,
  } = useCurrentCollectivite()!;
  const trackEvent = useEventTracker('app/trajectoires/snbc');
  const api = useApiClient();

  return useMutation(
    'snbc/telechargement',
    async () => {
      trackEvent('cta_download', {
        collectiviteId,
        niveauAcces,
        role,
        file: 'donnees',
      });
      const { blob, filename } = await api.getAsBlob({
        route: '/trajectoires/snbc/telechargement',
        params: { collectiviteId },
      });
      if (blob) {
        await saveBlob(
          blob,
          filename || `Trajectoire SNBC - ${collectiviteName}.xlsx`
        );
      }
    },
    DOWNLOAD_FILE_MUTATION_OPTIONS
  );
};
