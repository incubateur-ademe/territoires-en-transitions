import { useApiClient } from '@/app/core-logic/api/useApiClient';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { DOWNLOAD_FILE_MUTATION_OPTIONS } from '@/app/utils/useDownloadFile';
import { Event, useEventTracker } from '@/ui';
import { useMutation } from '@tanstack/react-query';

/** Télécharge le fichier xlsx de la trajectoire */
export const useTelechargementTrajectoire = () => {
  const { collectiviteId, nom: collectiviteName } = useCurrentCollectivite()!;
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
