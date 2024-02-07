import {SignupProps, SignupView} from './type';
import {SignupStep1} from './SignupStep1';
import {SignupStep2} from '@components/Signup/SignupStep2';
import {useState, useEffect} from 'react';

/**
 * Affiche le panneau création de compte
 */
export const Signup = (props: SignupProps) => {
  const signupState = useSignupState(props);
  const {view} = signupState;

  if (view === 'etape1') {
    return <SignupStep1 {...props} signupState={signupState} />;
  }

  if (view === 'etape2') {
    return <SignupStep2 {...props} signupState={signupState} />;
  }
};

/**
 * Gère l'état du formulaire de création de compte
 */
const useSignupState = (props: SignupProps) => {
  const {defaultView = 'etape1', defaultValues} = props;

  // la vue courante
  const [view, setView] = useState<SignupView>(defaultView);

  // synchronise l'état interne avec la vue voulue
  useEffect(() => setView(defaultView), [defaultView]);

  // données collectées dans les formulaires
  const [formData, setFormData] = useState(defaultValues);

  return {
    view,
    setView,
    formData,
    setFormData,
  };
};
export type SignupState = ReturnType<typeof useSignupState>;
