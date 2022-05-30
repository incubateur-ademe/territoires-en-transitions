import {supabaseClient} from 'core-logic/api/supabase';
import {CollectiviteCarteRead} from 'generated/dataLayer/collectivite_carte_read';
import {RegionRead} from 'generated/dataLayer/region_read';
import {DepartementRead} from 'generated/dataLayer/departement_read';
import {Referentiel} from 'types/litterals';

export type TFetchCollectiviteCardsArgs = {
  regionCodes: string[];
  departementCodes: string[];
  referentiels: Referentiel[];
  etoiles: number | null;
  score_fait_lt: number | null;
  score_fait_gt: number | null;
  completude_lt: number | null;
  completude_gt: number | null;
};

export const fetchCollectiviteCards = async (
  args: TFetchCollectiviteCardsArgs
): Promise<CollectiviteCarteRead[]> => {
  // la requête
  let query = supabaseClient
    .from<CollectiviteCarteRead>('collectivite_card')
    .select()
    .limit(20);

  if (args.regionCodes.length > 0)
    query = query.in('region_code', args.regionCodes);

  if (args.departementCodes.length > 0)
    query = query.in('departement_code', args.departementCodes);

  // attends les données
  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const fetchAllRegions = async (): Promise<RegionRead[]> => {
  const query = supabaseClient.from<RegionRead>('region').select();
  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

export const fetchAllDepartements = async (): Promise<DepartementRead[]> => {
  const query = supabaseClient.from<DepartementRead>('departement').select();
  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};
