import { ToastFloater } from '@/app/ui/shared/floating-ui/ToastFloater';
import { Icon } from '@tet/ui';
import classNames from 'classnames';
import { useState } from 'react';

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
  const renderToast = () => {
    const getIcon = (status: ToastStatus) => {
      switch (status) {
        case 'success':
          return 'check-line';
        case 'error':
          return 'close-line';
        case 'info':
          return 'information-line';
        default:
          return '';
      }
    };
    return (
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
          {status && <Icon icon={getIcon(status)} size="lg" className="mr-3" />}
          {message}
        </div>
      </ToastFloater>
    );
  };

  return { renderToast, setToast };
};
