import { saveBlob } from '@/app/utils/save-blob';
import { DOWNLOAD_FILE_MUTATION_OPTIONS } from '@/app/utils/toast/download-file-mutation-options';
import { useApiClient } from '@/app/utils/use-api-client';
import { useMutation } from '@tanstack/react-query';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Event, useEventTracker } from '@tet/ui';

/**
 * Télécharge le PDF de méthodologie de la release SNBC 3 importée : le même
 * millésime que la trajectoire affichée (stocké par l'import du lot 1).
 */
export const useTelechargementMethodologieSnbc3 = () => {
  const collectiviteId = useCollectiviteId();
  const api = useApiClient();
  const trackEvent = useEventTracker();

  return useMutation({
    mutationKey: ['snbc3/methodologie'],

    mutationFn: async () => {
      trackEvent(Event.trajectoire.downloadSnbcFile, {
        file: 'methodo-snbc3',
      });
      const { blob, filename } = await api.getAsBlob({
        route: '/trajectoires/snbc3/methodologie',
        params: { collectiviteId },
      });
      if (blob) {
        await saveBlob(blob, filename || 'Méthodologie trajectoire SNBC3.pdf');
      }
    },

    ...DOWNLOAD_FILE_MUTATION_OPTIONS,
  });
};
