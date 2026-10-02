import { appLabels } from '@/app/labels/catalog';
import { isAbortError } from '@/app/utils/is-abort-error';
import { saveBlob } from '@/app/utils/save-blob';
import { useApiClient } from '@/app/utils/use-api-client';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

export type DownloadArchive =
  | { status: 'idle'; download: () => void }
  | { status: 'downloading'; cancel: () => void };

/**
 * Télécharge une archive servie en flux par le backend, avec son nom lu dans
 * `Content-Disposition`. Annulable : l'assemblage d'un gros zip peut durer, et
 * quitter la page interrompt la requête.
 */
export const useDownloadArchive = ({
  mutationKey,
  route,
  params,
}: {
  mutationKey: readonly unknown[];
  route: string;
  params?: Record<string, string | number>;
}): DownloadArchive => {
  const apiClient = useApiClient();
  const abortController = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      abortController.current?.abort();
    },
    []
  );

  const { mutate, isPending } = useMutation({
    mutationKey,

    networkMode: 'always',

    mutationFn: async () => {
      const controller = new AbortController();
      abortController.current = controller;

      try {
        const { blob, filename } = await apiClient.getAsBlob({
          route,
          params,
          signal: controller.signal,
        });

        if (!filename) {
          throw new Error(
            'Archive received without a Content-Disposition name'
          );
        }
        await saveBlob(blob, filename);
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }
        throw error;
      } finally {
        if (abortController.current === controller) {
          abortController.current = null;
        }
      }
    },

    meta: {
      error: appLabels.telechargementFichierErreur,
    },
  });

  if (isPending) {
    return {
      status: 'downloading',
      cancel: () => abortController.current?.abort(),
    };
  }

  return { status: 'idle', download: () => mutate() };
};
