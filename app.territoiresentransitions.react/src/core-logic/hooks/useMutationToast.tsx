import {
  Mutation,
  Mutation as OldMutation,
  onlineManager as oldOnlineManager,
  onlineManager,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { useBaseToast } from './useBaseToast';

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
  const queryClient = useQueryClient();
  const { renderToast, setToast } = useBaseToast();

  const handleMutation = useCallback(
    (mutation?: Mutation | OldMutation) => {
      if (!oldOnlineManager.isOnline() || !onlineManager.isOnline()) {
        setToast(
          'error',
          "La connexion réseau semble être interrompue. Vos données ne peuvent pas être sauvegardées pour l'instant. Veuillez attendre que votre connexion soit rétablie pour utiliser l'application.",
          10_000
        );
        return;
      }

      const status = mutation?.state.status;
      if (
        (status === 'success' || status === 'error') &&
        !mutation?.meta?.disableToast
      ) {
        const message =
          (mutation?.meta?.[status] as string) || DEFAULT_MESSAGE[status];
        const hideDuration =
          (mutation?.meta?.autoHideDuration as number) || undefined;
        setToast(status, message, hideDuration);
      }
    },
    [setToast]
  );

  useEffect(() => {
    const unsubscribe = queryClient
      .getMutationCache()
      .subscribe(({ mutation }) => {
        handleMutation(mutation);
      });

    return unsubscribe;
  }, [handleMutation, queryClient]);

  return { renderToast };
};
