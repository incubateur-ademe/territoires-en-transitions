import {supabaseClient} from 'core-logic/api/supabase';
import {DcpRead} from 'generated/dataLayer/dcp_read';
import {RoleName} from 'generated/dataLayer';

export const claimCollectivite = async (id: number): Promise<boolean> => {
  const {data, error} = await supabaseClient.rpc('claim_collectivite', {
    id,
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
};

export const referentContact = async (
  collectivite_id: number
): Promise<ReferentContactResponse | null> => {
  const {data, error} = await supabaseClient.rpc('referent_contact', {
    id: collectivite_id,
  });

  if (error || !data) {
    return null;
  }
  return data as any as ReferentContactResponse;
};

export type PersonneList = {
  role_name: RoleName;
  personnes: DcpRead[];
};

export const userList = async (
  collectivite_id: number
): Promise<PersonneList[] | null> => {
  const {data, error} = await supabaseClient.rpc('collectivite_user_list', {
    id: collectivite_id,
  });

  if (error || !data) {
    return null;
  }
  return data as PersonneList[];
};
