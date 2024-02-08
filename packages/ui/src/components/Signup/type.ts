import {SignupState} from './Signup';

export type SignupView = 'etape1' | 'etape2' | 'infos';

export type SignupDataStep1 = {
  collectivite_id: number;
  email: string;
  password: string;
  cgu_acceptees: boolean;
  collectivite_engagee?: boolean;
};

export type SignupDataStep2 = {
  nom: string;
  prenom: string;
  tel: string;
  role: UserRole;
  poste?: string;
};

export type SignupData = SignupDataStep1 & SignupDataStep2;

export type UserRole =
  | 'equipe_politique'
  | 'services_techniques'
  | 'partenaire'
  | 'bureau_etudes';

export type SignupProps = {
  /** Vue sélectionnée par défaut */
  defaultView?: SignupView;
  /** Valeurs par défaut du formulaire (étape 1) */
  defaultValues?: SignupDataStep1;
  /** Indique que l'option "avec mot de passe" est activée */
  withPassword?: boolean;
  /** Indique qu'un appel réseau est en cours */
  isLoading?: boolean;
  /** Liste de collectivités auxquelles le compte peut être rattaché */
  collectivites: Array<{value: number; label: string}>;
  /** Appelé pour filtrer la liste des collectivités */
  onFilterCollectivites: (value: string) => void;
  /** Appelé à l'envoi du formulaire */
  onSubmit: (data: SignupData) => void;
  /** Appelé à l'annulation du formulaire */
  onCancel: () => void;
};

export type SignupPropsWithState = SignupProps & {signupState: SignupState};
