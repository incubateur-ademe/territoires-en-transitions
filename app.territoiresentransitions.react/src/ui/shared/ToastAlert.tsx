import {useState, ReactNode, useMemo} from 'react';
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

  const classNames = useMemo(() => {
    if (status === 'success') {
      return '!bg-green-500';
    }
    if (status === 'error') {
      return '!bg-red-500';
    }
    return;
  }, [status]);

  const icon = useMemo(() => {
    if (status === 'success') {
      return 'fr-fi-check-line';
    }
    if (status === 'error') {
      return 'fr-fi-close-line';
    }
    return;
  }, [status]);

  return isVisible ? (
    <ToastFloater
      open={isVisible}
      onClose={() => close()}
      className={classNames}
      autoHideDuration={autoHideDuration}
    >
      <div className="flex items-center">
        <div className={`flex mr-3 ${icon}`}></div>
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
