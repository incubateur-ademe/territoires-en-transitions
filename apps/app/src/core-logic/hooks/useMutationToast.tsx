import { Mutation, onlineManager, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
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
  const processedMutations = useRef(new Set<string>());

  const handleMutation = useCallback(
    (mutation: Mutation) => {
      const mutationUniqueKey = `${mutation.mutationId}-${mutation.state.submittedAt}`;

      // Skip if mutation has already been processed
      if (processedMutations.current.has(mutationUniqueKey)) {
        return;
      }

      // Mark this mutation as processed
      processedMutations.current.add(mutationUniqueKey);

      if (!onlineManager.isOnline()) {
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
        if (mutation) {
          handleMutation(mutation);
        }
      });

    return unsubscribe;
  }, [handleMutation, queryClient]);

  return { renderToast };
};
