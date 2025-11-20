import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { useApiClient } from '@/app/utils/use-api-client';
import { DOWNLOAD_FILE_MUTATION_OPTIONS } from '@/app/utils/useDownloadFile';
import { useMutation } from '@tanstack/react-query';
import { Event, useEventTracker } from '@tet/ui';

/** Télécharge le fichier xlsx modèle */
export const useTelechargementModele = () => {
  const api = useApiClient();
  const trackEvent = useEventTracker();

  return useMutation({
    mutationKey: ['snbc/modele'],

    mutationFn: async () => {
      trackEvent(Event.trajectoire.downloadSnbcFile, {
        file: 'modele',
      });
      const { blob, filename } = await api.getAsBlob({
        route: '/trajectoires/snbc/modele',
      });
      if (blob) {
        await saveBlob(blob, filename || `Trajectoire SNBC - modèle.xlsx`);
      }
    },

    ...DOWNLOAD_FILE_MUTATION_OPTIONS,
  });
};
