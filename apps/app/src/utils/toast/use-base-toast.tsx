import { appLabels } from '@/app/labels/catalog';
import { ToastFloater } from '@/app/ui/shared/floating-ui/ToastFloater';
import { Icon } from '@tet/ui';
import classNames from 'classnames';
import { type JSX, useCallback, useState } from 'react';

type Hidden = null;
export type ToastStatus = Hidden | 'success' | 'error' | 'info';

type ToastAction = {
  label: string;
  onClick: () => void;
};

type ShowToastArgs = {
  status: ToastStatus;
  message: string;
  autoHideDuration?: number;
  action?: ToastAction;
};

const ToastActionButtons = ({
  action,
  onClose,
}: {
  action: ToastAction;
  onClose: () => void;
}): JSX.Element => (
  <>
    <button
      type="button"
      className="ml-4 whitespace-nowrap font-bold underline"
      onClick={() => {
        onClose();
        action.onClick();
      }}
    >
      {action.label}
    </button>
    <button
      type="button"
      aria-label={appLabels.fermer}
      className="ml-3 flex"
      onClick={onClose}
    >
      <Icon icon="close-line" size="sm" aria-hidden />
    </button>
  </>
);

/**
 * Fourni les fonctions de base pour afficher une notification "toast"
 */
export const useBaseToast = () => {
  const [status, setStatus] = useState<ToastStatus>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [action, setAction] = useState<ToastAction | undefined>(undefined);
  // Sert de `key` au `ToastFloater` : le remonter réarme la fermeture
  // automatique, qu'un toast enchaîné hériterait sinon du précédent.
  const [occurrence, setOccurrence] = useState(0);

  const close = () => {
    setStatus(null);
    setMessage(null);
    setAction(undefined);
  };

  /**
   * Déclenche l'affichage d'un message (il faut que la fonction `renderToast`
   * soit invoquée dans le rendu d'un composant react pour que l'affichage soit
   * effectif)
   */
  const showToast = useCallback(
    ({ status, message, autoHideDuration, action }: ShowToastArgs) => {
      setMessage(message);
      setStatus(status);
      setDuration(autoHideDuration);
      setAction(action);
      setOccurrence((n) => n + 1);
    },
    []
  );

  const setToast = useCallback(
    (status: ToastStatus, message: string, autoHideDuration?: number) =>
      showToast({ status, message, autoHideDuration }),
    [showToast]
  );

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
        key={occurrence}
        open={status !== null && message !== null}
        onClose={() => close()}
        className={classNames('!text-white', {
          '!bg-success': status === 'success',
          '!bg-error-1': status === 'error',
          '!bg-warning-1': status === 'info',
        })}
        autoHideDuration={duration}
      >
        <div
          role={status === 'error' ? 'alert' : 'status'}
          className="flex items-center"
          data-test={`toast-${status}`}
        >
          {status && <Icon icon={getIcon(status)} size="lg" className="mr-3" />}
          {message}
          {action && <ToastActionButtons action={action} onClose={close} />}
        </div>
      </ToastFloater>
    );
  };

  return { renderToast, setToast, setToastWithAction: showToast };
};

export type BaseToast = ReturnType<typeof useBaseToast>;
