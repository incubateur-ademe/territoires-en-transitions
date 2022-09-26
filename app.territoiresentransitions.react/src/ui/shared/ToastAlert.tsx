import {useState, ReactNode} from 'react';
import classNames from 'classnames';
import {ToastFloater} from './floating-ui/ToastFloater';

/**
 * Affiche une alerte "error" ou "success" sous forme de bandeau qui disparait
 * automatiquement au bout de quelques secondes.
 * (utile pour les cas où on ne peut pas utiliser le gestionnaire centralisé "Toasters")
 * */
export const ToastAlert = ({
  toastAlert,
  children,
  autoHideDuration,
}: {
  /** Etat et fonctions de contrôle de l'alerte */
  toastAlert: ToastAlertHook;
  /** Une fonction recevant l'état courant et renvoyant le contenu à afficher
   * dans l'alerte */
  children: (status: ToastAlertStatus) => ReactNode;
  /** Nombre en millisecondes à attendre avant d'appeler la fonction onClose.
   * Par default: 4000 */
  autoHideDuration?: number;
}) => {
  const {isVisible, status, close} = toastAlert;

  return isVisible ? (
    <ToastFloater
      open={isVisible}
      onClose={() => close()}
      className={classNames(
        {'!bg-green-500': status === 'success'},
        {'!bg-red-500': status === 'error'}
      )}
      autoHideDuration={autoHideDuration}
    >
      <div className="flex items-center">
        <div
          className={`flex mr-3 ${classNames(
            {'fr-fi-check-line': status === 'success'},
            {'fr-fi-close-line': status === 'error'}
          )}`}
        ></div>
        {children(status)}
      </div>
    </ToastFloater>
  ) : null;
};

/** Génère un état et les fonctions de contrôle de l'alerte */
export const useToastAlert = (): ToastAlertHook => {
  const [status, setStatus] = useState<ToastAlertStatus>(null);
  return {
    showSuccess: () => setStatus('success'),
    showError: () => setStatus('error'),
    close: () => setStatus(null),
    isVisible: Boolean(status),
    status: status,
  };
};

type Hidden = null;
type ToastAlertStatus = Hidden | 'success' | 'error';

type ToastAlertHook = {
  showSuccess: () => void;
  showError: () => void;
  close: () => void;
  isVisible: boolean;
  status: ToastAlertStatus;
};
