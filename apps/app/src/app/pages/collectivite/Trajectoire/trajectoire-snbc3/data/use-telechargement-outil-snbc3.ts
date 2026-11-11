import { saveBlob } from '@/app/utils/save-blob';
import { DOWNLOAD_FILE_MUTATION_OPTIONS } from '@/app/utils/toast/download-file-mutation-options';
import { useApiClient } from '@/app/utils/use-api-client';
import { useMutation } from '@tanstack/react-query';
import { Event, useEventTracker } from '@tet/ui';

/**
 * La route `snbc3/outil` n'existe pas encore côté backend : les boutons de
 * téléchargement restent masqués jusqu'au lot 5, qui passe ce drapeau à `true`.
 */
export const IS_OUTIL_SNBC3_DISPONIBLE = false;

/**
 * Télécharge l'outil Excel SNBC 3, tel qu'il est publié. La route
 * `snbc3/outil` est livrée par le lot 5 (export xlsx).
 */
export const useTelechargementOutilSnbc3 = () => {
  const api = useApiClient();
  const trackEvent = useEventTracker();

  return useMutation({
    mutationKey: ['snbc3/outil'],

    mutationFn: async () => {
      trackEvent(Event.trajectoire.downloadSnbcFile, { file: 'outil-snbc3' });
      const { blob, filename } = await api.getAsBlob({
        route: '/trajectoires/snbc3/outil',
      });
      if (blob) {
        await saveBlob(blob, filename || 'Trajectoire SNBC3 - outil.xlsx');
      }
    },

    ...DOWNLOAD_FILE_MUTATION_OPTIONS,
  });
};
