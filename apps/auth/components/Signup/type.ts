import { ZxcvbnResult } from '@zxcvbn-ts/core';
import { FormState } from '../../components/Login/useFormState';
import { ResendFunction, VerifyOTPData } from '../../components/VerifyOTP';

const ValidSignupView = [
  'etape1',
  'etape2',
  'etape3',
  'msg_lien_envoye',
] as const;
export const isValidSignupView = (view: string | null) =>
  ValidSignupView.includes(view as SignupView);
export type SignupView = (typeof ValidSignupView)[number];

export type SignupDataStep1 = {
  email: string;
  password: string;
};

export type SignupDataStep2 = VerifyOTPData;

export type SignupDataStep3 = {
  email: string;
  nom: string;
  prenom: string;
  telephone: string;
  cgu_acceptees: boolean;
};

export type SignupData = SignupDataStep1 | SignupDataStep2 | SignupDataStep3;

export type SignupProps = {
  /** Vue courante */
  view: SignupView;
  /** Permet de passer d'une vue à une autre */
  setView: (view: SignupView) => void;
  /** Valeurs par défaut du formulaire (étape 1) */
  defaultValues?: { email: string | null; otp?: string | null };
  /** Erreur à afficher */
  error: string | null;
  /** Indique qu'un appel réseau est en cours */
  isLoading?: boolean;
  /** Liste de collectivités auxquelles le compte peut être rattaché */
  collectivites: Array<{ value: number; label: string }>;
  /** Appelé pour filtrer la liste des collectivités */
  onFilterCollectivites: (value: string) => void;
  /** Appelé à l'envoi du formulaire */
  onSubmit: (data: SignupData) => void;
  /** Appelé à l'annulation du formulaire */
  onCancel: () => void;
  /** Fonction appelée pour renvoyer l'email contenant le code */
  onResend: ResendFunction;
  /** Pour contrôler la robustesse des mots de passe */
  getPasswordStrength: (
    password: string,
    otherValues: string[]
  ) => ZxcvbnResult | null;
};

export type SignupPropsWithState = SignupProps & { formState: FormState };
