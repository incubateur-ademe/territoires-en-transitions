import {supabase} from 'core-logic/api/supabase';

export interface InscriptionUtilisateur {
  email: string;
  mot_de_passe: string;
  nom: string;
  prenom: string;
  vie_privee_conditions: boolean;
}

export const politique_vie_privee =
  'https://www.ademe.fr/lademe/infos-pratiques/politique-protection-donnees-a-caractere-personnel';

export const registerUser = async (inscription: InscriptionUtilisateur) => {
  if (!inscription.vie_privee_conditions)
    throw 'cannot register user without vie_privee_conditions';

  // todo test signup with existing user email.

  const signedUp = await supabase.auth.signUp({
    email: inscription.email,
    password: inscription.mot_de_passe,
  });

  if (signedUp.error) throw signedUp.error;

  // todo later save DCPs
};
