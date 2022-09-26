import classNames from 'classnames';
import {useEffect, useState} from 'react';
import {useQueryClient} from 'react-query';
import {ToastFloater} from 'ui/shared/floating-ui/ToastFloater';

type TMessageByMutationKey = {
  [key: string]: {
    success: string;
    error: string;
  };
};

const messageByMutationKey: TMessageByMutationKey = {
  upload_preuve: {
    success: 'Preuve téléversée !',
    error: 'Erreur lors du téléversement',
  },
  save_reponse: {
    success: 'La personnalisation du potentiel est enregistrée',
    error: "La personnalisation du potentiel n'a pas été enregistrée",
  },
};

// messages génériques
const DEFAULT_MESSAGE = {
  success: 'Modification enregistrée',
  error: "Erreur lors de l'enregistrement",
};

type Hidden = null;
type ToastStatus = Hidden | 'success' | 'error';

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
      const key = mutation && (mutation.options.mutationKey as string);
      const status = mutation?.state.status;
      if (key && (status === 'success' || status === 'error')) {
        const message = messageByMutationKey[key]
          ? messageByMutationKey[key][status]
          : DEFAULT_MESSAGE[status];
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
