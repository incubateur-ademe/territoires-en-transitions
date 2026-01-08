import { useMutationCacheSubscriber } from '@/app/utils/react-query/use-mutation-cache-subscriber';
import {
  onlineManager as oldOnlineManager,
  onlineManager,
} from '@tanstack/react-query';
import { useCallback } from 'react';
import { useBaseToast } from './use-base-toast';

// messages génériques
const DEFAULT_MESSAGE = {
  success: 'Modification enregistrée',
  error: "Erreur lors de l'enregistrement",
};

/**
 * Écoute toutes les mutations de l'application et fait apparaître un toast
 * avec un message par défaut si l'on a pas spécifié de message dans l'objet "meta" des options de "useMutation".
 * Passer "disableToast" à true dans l'objet "meta" si l'on ne veut pas afficher de toast.
 */
export const useMutationToast = () => {
  const { renderToast, setToast } = useBaseToast();

  const handleMutation = useCallback(
    ({
      status,
      meta,
    }: {
      status: string;
      meta?: Record<string, string | number | boolean>;
    }) => {
      if (!oldOnlineManager.isOnline() || !onlineManager.isOnline()) {
        setToast(
          'error',
          "La connexion réseau semble être interrompue. Vos données ne peuvent pas être sauvegardées pour l'instant. Veuillez attendre que votre connexion soit rétablie pour utiliser l'application.",
          10_000
        );
        return;
      }

      if (!meta?.disableToast) {
        if (
          (status === 'success' && !meta?.disableSuccess) ||
          (status === 'error' && !meta?.disableError)
        ) {
          const message = (meta?.[status] as string) || DEFAULT_MESSAGE[status];
          const hideDuration = (meta?.autoHideDuration as number) || undefined;
          setToast(status, message, hideDuration);
        }
      }
    },
    [setToast]
  );

  useMutationCacheSubscriber(({ status, meta }) => {
    handleMutation({ status, meta });
  });

  return { renderToast };
};
