import { useMutationCacheSubscriber } from '@/app/utils/react-query/use-mutation-cache-subscriber';
import { appLabels } from '@/app/labels/catalog';
import {
  onlineManager as oldOnlineManager,
  onlineManager,
} from '@tanstack/react-query';
import { useCallback } from 'react';
import { useBaseToast } from './use-base-toast';

// messages génériques
const DEFAULT_MESSAGE = {
  success: appLabels.mutationSuccess,
  error: appLabels.mutationError,
};

/**
 * Écoute toutes les mutations de l'application et fait apparaître un toast
 * avec un message par défaut si l'on a pas spécifié de message dans l'objet "meta" des options de "useMutation".
 * Passer "disableToast" à true dans l'objet "meta" si l'on ne veut pas afficher de toast.
 */
export const useMutationToast = (
  setToast: ReturnType<typeof useBaseToast>['setToast']
) => {
  const handleMutation = useCallback(
    ({
      status,
      meta,
      errorKey,
    }: {
      status: string;
      meta?: Record<string, string | number | boolean>;
      errorKey?: string;
    }) => {
      if (!oldOnlineManager.isOnline() || !onlineManager.isOnline()) {
        setToast('error', appLabels.mutationErreurReseauSauvegarde, 10_000);
        return;
      }

      if (
        ((status === 'success' && meta?.success) || status === 'error') &&
        !meta?.disableToast
      ) {
        // L'API renvoie un code, pas une phrase : le libellé vient d'ici.
        const message =
          (meta?.[status] as string) ||
          (errorKey ? appLabels.erreursApi[errorKey] : undefined) ||
          DEFAULT_MESSAGE[status];
        const hideDuration = (meta?.autoHideDuration as number) || undefined;
        setToast(status, message, hideDuration);
      }
    },
    [setToast]
  );

  useMutationCacheSubscriber(({ status, meta, errorKey }) => {
    handleMutation({ status, meta, errorKey });
  });
};
