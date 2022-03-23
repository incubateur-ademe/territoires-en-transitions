import {useState, SyntheticEvent, ReactNode} from 'react';
import {Snackbar, SnackbarCloseReason} from '@material-ui/core';
import MuiAlert, {Color} from '@material-ui/lab/Alert';

/**
 * Affiche une alerte "error" ou "success" sous forme de bandeau qui disparait
 * automatiquement au bout de quelques secondes.
 * (utile pour les cas où on ne peut pas utiliser le gestionnaire centralisé "Toasters")
 * */
export const ToastAlert = ({
  toastAlert,
  children,
}: {
  /** Etat et fonctions de contrôle de l'alerte */
  toastAlert: ToastAlertHook;
  /** Une fonction recevant l'état courant et renvoyant le contenu à afficher
   * dans l'alerte */
  children: (status: ToastAlertStatus) => ReactNode;
}) => {
  const {isVisible, status, close} = toastAlert;

  const handleClose = (event: SyntheticEvent, reason: SnackbarCloseReason) => {
    if (reason !== 'clickaway') {
      close();
    }
  };

  return isVisible ? (
    <Snackbar open={isVisible} autoHideDuration={2000} onClose={handleClose}>
      <MuiAlert severity={status as Color} variant="filled">
        {children(status)}
      </MuiAlert>
    </Snackbar>
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
