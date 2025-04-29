import { getTrpcQueryClient } from '@/api/utils/trpc/client';
import { Mutation, onlineManager } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import {
  Mutation as OldMutation,
  onlineManager as oldOnlineManager,
  useQueryClient,
} from 'react-query';
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
  // TODO: fuse the two query clients. Not done for now because not the same version and a lot of changes
  const queryClient = useQueryClient();
  const trpcQueryClient = getTrpcQueryClient();
  const { renderToast, setToast } = useBaseToast();

  const handleMutation = useCallback((mutation?: Mutation | OldMutation) => {
    if (!oldOnlineManager.isOnline() || !onlineManager.isOnline()) {
      setToast(
        'error',
        "La connexion réseau semble être interrompue. Vos données ne peuvent pas être sauvegardées pour l'instant. Veuillez attendre que votre connexion soit rétablie pour utiliser l'application.",
        10_000
      );
    } else {
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
    }
  }, []);

  useEffect(() => {
    return queryClient.getMutationCache().subscribe((mutation) => {
      handleMutation(mutation);
    });
  }, []);

  useEffect(() => {
    return trpcQueryClient.getMutationCache().subscribe(({ mutation }) => {
      handleMutation(mutation);
    });
  }, []);

  return { renderToast };
};
