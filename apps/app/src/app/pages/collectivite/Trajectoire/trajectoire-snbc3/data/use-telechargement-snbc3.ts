import { saveBlob } from '@/app/utils/save-blob';
import { DOWNLOAD_FILE_MUTATION_OPTIONS } from '@/app/utils/toast/download-file-mutation-options';
import { useApiClient } from '@/app/utils/use-api-client';
import { useMutation } from '@tanstack/react-query';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Event, useEventTracker } from '@tet/ui';

/**
 * Télécharge un fichier de la release SNBC 3 importée. Les routes prennent la
 * collectivité courante, au moins pour évaluer le flag SNBC 3.
 */
export const useTelechargementSnbc3 = ({
  route,
  file,
  defaultFileName,
}: {
  route: `/trajectoires/snbc3/${string}`;
  /** Fichier, pour l'événement de suivi `downloadSnbcFile`. */
  file: string;
  /** Nom si la réponse n'en donne pas. */
  defaultFileName: string;
}) => {
  const collectiviteId = useCollectiviteId();
  const api = useApiClient();
  const trackEvent = useEventTracker();

  return useMutation({
    mutationKey: [route],

    mutationFn: async () => {
      trackEvent(Event.trajectoire.downloadSnbcFile, { file });
      const { blob, filename } = await api.getAsBlob({
        route,
        params: { collectiviteId },
      });
      if (blob) {
        await saveBlob(blob, filename || defaultFileName);
      }
    },

    ...DOWNLOAD_FILE_MUTATION_OPTIONS,
  });
};
