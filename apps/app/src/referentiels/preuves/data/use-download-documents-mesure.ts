import { appLabels } from '@/app/labels/catalog';
import { isAbortError } from '@/app/utils/is-abort-error';
import { saveBlob } from '@/app/utils/save-blob';
import { useApiClient } from '@/app/utils/use-api-client';
import { useMutation } from '@tanstack/react-query';
import { ActionId } from '@tet/domain/referentiels';
import { useEffect, useRef } from 'react';

const makeDownloadArchiveRoute = ({
  collectiviteId,
  actionId,
}: {
  collectiviteId: number;
  actionId: ActionId;
}): string =>
  `/collectivites/${collectiviteId}/mesures/${actionId}/documents/archive`;

type DownloadDocumentsMesure =
  | { status: 'idle'; download: () => void }
  | { status: 'downloading'; cancel: () => void };

export const useDownloadDocumentsMesure = ({
  collectiviteId,
  actionId,
}: {
  collectiviteId: number;
  actionId: ActionId;
}): DownloadDocumentsMesure => {
  const apiClient = useApiClient();
  const abortController = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      abortController.current?.abort();
    },
    []
  );

  const { mutate, isPending } = useMutation({
    mutationKey: ['download-documents-mesure', collectiviteId, actionId],

    networkMode: 'always',

    mutationFn: async () => {
      const controller = new AbortController();
      abortController.current = controller;

      try {
        const { blob, filename } = await apiClient.getAsBlob({
          route: makeDownloadArchiveRoute({ collectiviteId, actionId }),
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
