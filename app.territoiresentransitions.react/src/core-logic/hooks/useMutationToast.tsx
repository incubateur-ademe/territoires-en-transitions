import {useEffect} from 'react';
import {useQueryClient} from 'react-query';
import {useBaseToast} from './useBaseToast';

// messages génériques
const DEFAULT_MESSAGE = {
  success: 'Modification enregistrée',
  error: "Erreur lors de l'enregistrement",
};

/**
 * Écoute toutes les mutations de l'application et fait apparaître un toast
 * avec un message par défaut si l'on a pas spécifié de message dans l'objet "meta" des options de "useMutation".
 * Passer "disableToast" à true dans l'objet "meta" si l'on ne vuet pas afficher de toast.
 */
export const useMutationToast = () => {
  const queryClient = useQueryClient();
  const {renderToast, setToast} = useBaseToast();

  useEffect(() => {
    return queryClient.getMutationCache().subscribe(mutation => {
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
    });
  }, []);

  return {renderToast};
};
