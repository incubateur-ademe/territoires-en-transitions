import {useState} from 'react';

/**
 * Gère l'état du formulaire de connexion et de création de compte
 * (pour partarger l'email entre plusieurs étapes de la modale)
 */
export const useFormState = (props: {
  defaultValues?: {email?: string | null};
}) => {
  const {defaultValues} = props;

  // données collectées dans les formulaires
  const [email, setEmail] = useState(defaultValues?.email || '');

  return {
    email,
    setEmail,
  };
};

export type FormState = ReturnType<typeof useFormState>;
