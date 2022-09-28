import classNames from 'classnames';
import {useEffect, useState} from 'react';
import {useQueryClient} from 'react-query';
import {ToastFloater} from 'ui/shared/floating-ui/ToastFloater';

// messages génériques
const DEFAULT_MESSAGE = {
  success: 'Modification enregistrée',
  error: "Erreur lors de l'enregistrement",
};

type Hidden = null;
type ToastStatus = Hidden | 'success' | 'error';

/**
 * Écoute toutes les mutations de l'application et fait apparaître un toast
 * avec un message par défaut si l'on a pas spécifié de message dans l'objet "meta" des options de "useMutation".
 * Passer "disableToast" à true dans l'objet "meta" si l'on ne vuet pas afficher de toast.
 */
export const useMutationToast = () => {
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<ToastStatus>(null);
  const [message, setMessage] = useState<string | null>(null);

  const close = () => {
    setStatus(null);
    setMessage(null);
  };

  useEffect(() => {
    return queryClient.getMutationCache().subscribe(mutation => {
      const status = mutation?.state.status;
      if (
        (status === 'success' || status === 'error') &&
        !mutation?.meta?.disableToast
      ) {
        const message =
          (mutation?.meta?.[status] as string) || DEFAULT_MESSAGE[status];
        setMessage(message);
        setStatus(status);
      }
    });
  }, []);

  const renderToast = () => (
    <ToastFloater
      open={status !== null}
      onClose={() => close()}
      className={classNames(
        {'!bg-green-500': status === 'success'},
        {'!bg-red-500': status === 'error'}
      )}
    >
      <div className="flex items-center">
        <div
          className={`flex mr-3 ${classNames(
            {'fr-fi-check-line': status === 'success'},
            {'fr-fi-close-line': status === 'error'}
          )}`}
        ></div>
        {message}
      </div>
    </ToastFloater>
  );

  return {renderToast};
};
