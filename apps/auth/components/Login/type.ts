import { ResendFunction, VerifyOTPData } from '../../components/VerifyOTP';
import { ZxcvbnResult } from '@zxcvbn-ts/core';
import { FormState } from './useFormState';

const ValidLoginView = [
  'etape1',
  'mdp_oublie',
  'msg_lien_envoye',
  'msg_init_mdp',
  'verify',
  'recover',
  'reset_mdp',
] as const;
export const isValidLoginView = (view: string | null) =>
  ValidLoginView.includes(view as LoginView);
export type LoginView = (typeof ValidLoginView)[number];

export type Credentials = { email: string; password?: string };

export type LoginData = Credentials | VerifyOTPData;

export type LoginProps = {
  /** Vue courante */
  view: LoginView;
  /** Permet de passer d'une vue à une autre */
  setView: (view: LoginView) => void;
  /** Valeurs par défaut pour initialiser les formulaires */
  defaultValues: { email: string | null; otp: string | null };
  /** Erreur à afficher */
  error: string | null;
  /** Indique qu'un appel réseau est en cours */
  isLoading?: boolean;
  /** Fonction appelée à l'envoi du formulaire */
  onSubmit: (formData: LoginData) => void;
  /** Fonction appelée à l'annulation du formulaire */
  onCancel: () => void;
  /** Fonction appelée pour renvoyer l'email contenant le code */
  onResend: ResendFunction;
  /** Fonction appelée lors du clic sur le bouton "contactez le support" */
  onOpenChatbox?: () => void;
  /** Pour contrôler la robustesse des mots de passe */
  getPasswordStrength: (
    password: string,
    otherValues: string[]
  ) => ZxcvbnResult | null;
};

export type LoginPropsWithState = LoginProps & { formState: FormState };
