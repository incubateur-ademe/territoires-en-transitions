import {LoginState} from './useLoginState';

export type LoginView =
  | 'par_lien'
  | 'par_mdp'
  | 'mdp_oublie'
  | 'msg_lien_envoye'
  | 'msg_init_mdp';

export type Credentials = {email: string; password?: string};

export type LoginProps = {
  /** Vue sélectionnée par défaut */
  defaultView: LoginView;
  /** Indique qu'un appel réseau est en cours */
  isLoading?: boolean;
  /** Fonction appelée à l'envoi du formulaire */
  onSubmit?: (view: LoginView, credentials: Credentials) => void;
  /** Fonction appelée à l'annulation du formulaire */
  onCancel: () => void;
};

export type LoginPropsWithState = LoginProps & {loginState: LoginState};
