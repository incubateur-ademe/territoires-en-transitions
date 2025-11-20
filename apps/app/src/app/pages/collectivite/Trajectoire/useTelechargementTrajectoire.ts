import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { useApiClient } from '@/app/utils/use-api-client';
import { DOWNLOAD_FILE_MUTATION_OPTIONS } from '@/app/utils/useDownloadFile';
import { useMutation } from '@tanstack/react-query';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Event, useEventTracker } from '@tet/ui';

/** Télécharge le fichier xlsx de la trajectoire */
export const useTelechargementTrajectoire = () => {
  const { collectiviteId, nom: collectiviteName } = useCurrentCollectivite();
  const trackEvent = useEventTracker();
  const api = useApiClient();

  return useMutation({
    mutationKey: ['snbc/telechargement'],

    mutationFn: async () => {
      trackEvent(Event.trajectoire.downloadSnbcFile, {
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
    ...DOWNLOAD_FILE_MUTATION_OPTIONS,
  });
};
