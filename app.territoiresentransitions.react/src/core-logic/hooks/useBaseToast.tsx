import classNames from 'classnames';
import {useState} from 'react';
import {ToastFloater} from 'ui/shared/floating-ui/ToastFloater';

type Hidden = null;
export type ToastStatus = Hidden | 'success' | 'error' | 'info';

/**
 * Fourni les fonctions de base pour afficher une notification "toast"
 */
export const useBaseToast = () => {
  const [status, setStatus] = useState<ToastStatus>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | undefined>(undefined);

  const close = () => {
    setStatus(null);
    setMessage(null);
  };

  /**
   * Déclenche l'affichage d'un message (il faut que la fonction `renderToast`
   * soit invoquée dans le rendu d'un composant react pour que l'affichage soit
   * effectif)
   */
  const setToast = (
    status: ToastStatus,
    message: string,
    autoHideDuration?: number
  ) => {
    setMessage(message);
    setStatus(status);
    setDuration(autoHideDuration);
  };

  /**
   * Assure le rendu du composant (affiche le message quand `setToast` a été appelé)
   */
  const renderToast = () => (
    <ToastFloater
      open={status !== null && message !== null}
      onClose={() => close()}
      className={classNames('!text-white', {
        '!bg-success': status === 'success',
        '!bg-error-1': status === 'error',
        '!bg-warning-1': status === 'info',
      })}
      autoHideDuration={duration}
    >
      <div className="flex items-center" data-test={`toast-${status}`}>
        <div
          className={`flex mr-3 ${classNames({
            'fr-icon-check-line': status === 'success',
            'fr-icon-close-line': status === 'error',
            'fr-icon-information-line': status === 'info',
          })}`}
        ></div>
        {message}
      </div>
    </ToastFloater>
  );

  return {renderToast, setToast};
};
