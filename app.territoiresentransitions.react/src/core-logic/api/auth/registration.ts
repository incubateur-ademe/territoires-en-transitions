import { TablesInsert } from '@/api';
import { supabaseClient } from 'core-logic/api/supabase';

export interface InscriptionUtilisateur {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  telephone?: string;
  vie_privee_conditions: boolean;
}

export const politique_vie_privee =
  'https://www.ademe.fr/lademe/infos-pratiques/politique-protection-donnees-a-caractere-personnel';

type DcpWrite = TablesInsert<'dcp'>;

export const registerUser = async (inscription: InscriptionUtilisateur) => {
  if (!inscription.vie_privee_conditions)
    throw Error(
      'La politique de protection des données personnelles doit être acceptée.'
    );

  const email = inscription.email.toLowerCase();
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password: inscription.password,
  });

  if (!data.user || error) throw error?.message;

  const dcp: DcpWrite = {
    telephone: inscription.telephone,
    email,
    prenom: inscription.prenom,
    nom: inscription.nom,
    user_id: data.user.id,
  };
  await supabaseClient.from('dcp').insert([dcp]);
  await supabaseClient.rpc('accepter_cgu');
};
