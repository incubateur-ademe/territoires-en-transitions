import {supabase} from 'core-logic/api/supabase';

export const claimEpci = async (siren: string): Promise<boolean> => {
  const {data, error} = await supabase.rpc('claim_epci', {
    siren,
  });

  if (error) {
    console.error(error);
    return false;
  }
  return !!data;
};

export type ReferentContactResponse = {
  email: string;
  nom: string;
  prenom: string;
}; // TODO : shuold be generated

export const referentContact = async (siren: string): Promise<any | null> => {
  // Promise<ReferentContactResponse | null> TODO : type me !
  const {data, error} = await supabase.rpc('referent_contact', {
    siren,
  });

  if (error || !data) {
    console.error('referentContact error', error);
    return null;
  }
  console.log('referentContact data : ', data);
  return data;
};
