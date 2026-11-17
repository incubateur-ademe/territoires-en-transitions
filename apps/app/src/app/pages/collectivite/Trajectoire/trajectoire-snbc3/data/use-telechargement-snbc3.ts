import { saveBlob } from '@/app/utils/save-blob';
import { DOWNLOAD_FILE_MUTATION_OPTIONS } from '@/app/utils/toast/download-file-mutation-options';
import { useApiClient } from '@/app/utils/use-api-client';
import { useMutation } from '@tanstack/react-query';
import { Event, useEventTracker } from '@tet/ui';

/**
 * Télécharge un fichier de la release SNBC 3 importée : un fichier publié
 * (route publique, sans paramètre), ou le classeur ouvert sur le territoire
 * de la collectivité.
 */
export const useTelechargementSnbc3 = ({
  route,
  params,
  file,
  defaultFileName,
}: {
  route: `/trajectoires/snbc3/${string}`;
  params?: { collectiviteId: number };
  /** Fichier, pour l'événement de suivi `downloadSnbcFile`. */
  file: string;
  /** Nom si la réponse n'en donne pas. */
  defaultFileName: string;
}) => {
  const api = useApiClient();
  const trackEvent = useEventTracker();

  return useMutation({
    mutationKey: [route, params],

    mutationFn: async () => {
      trackEvent(Event.trajectoire.downloadSnbcFile, { file });
      const { blob, filename } = await api.getAsBlob({
        route,
        params,
      });
      if (blob) {
        await saveBlob(blob, filename || defaultFileName);
      }
    },

    ...DOWNLOAD_FILE_MUTATION_OPTIONS,
  });
};
