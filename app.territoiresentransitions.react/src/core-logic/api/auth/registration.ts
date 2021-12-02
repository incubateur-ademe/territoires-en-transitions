import {supabase} from 'core-logic/api/supabase';
import {DcpWrite} from 'generated/dataLayer/dcp_write';
export interface InscriptionUtilisateur {
  email: string;
  password: string;
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
    password: inscription.password,
  });

  if (!signedUp.user || signedUp.error) throw signedUp.error;

  // todo later save DCPs
  const dcp: DcpWrite = {
    email: inscription.email,
    prenom: inscription.prenom,
    nom: inscription.nom,
    user_id: signedUp.user.id,
  };
  await supabase.from('dcp').insert([dcp]);
};
