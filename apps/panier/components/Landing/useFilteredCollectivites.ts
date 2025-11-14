import { useSupabase } from '@/api';
import useSWR from 'swr';

type Collectivite = {
  collectivite_id: number;
  nom: string;
  departement_code?: number;
  engagee?: boolean;
};

/** Donne la liste des collectivités dont le nom inclus la chaîne recherchée */
export const useFilteredCollectivites = (search: string, limit = 10) => {
  const supabase = useSupabase();
  const key = `site_labellisation-filtered-${search}`;
  return useSWR(key, async () => {
    const query = supabase
      .from('site_labellisation')
      .select('collectivite_id, nom, departement_code, engagee')
      .order('nom');

    const processedSearch = makeSearchString(search, 'nom');
    if (processedSearch) {
      query.or(processedSearch);
    }

    query.limit(limit);

    const { error, data } = await query.returns<Collectivite[]>();

    if (error) {
      throw new Error(key);
    }
    if (!data || !data.length) {
      return null;
    }

    return data || [];
  });
};

/**
 * Génère une chaîne pour faire une recherche avec l'opérateur `ilike` de
 * postgrest avec plusieurs variantes de la chaîne originale avec ou sans
 * espaces ou tirets entre les mots.
 *
 * @param search chaîne à rechercher
 * @param column nom de la colonne
 * @returns
 */
export const makeSearchString = (search: string, column: string) => {
  if (!search) {
    return;
  }

  const processedSearch = search
    .split(' ')
    .map((w) => w.trim())
    .filter((w) => w !== '')
    .join(' ');

  const processedSearchWithDash = processedSearch.split(' ').join('-');
  const processedSearchWithDashAndSpace = processedSearch
    .split(' ')
    .join(' - ');
  const processedSearchWithoutDash = processedSearch.split('-').join(' ');

  return [
    `"${column}".ilike.%${processedSearch}%`,
    `"${column}".ilike.%${processedSearchWithDash}%`,
    `"${column}".ilike.%${processedSearchWithDashAndSpace}%`,
    `"${column}".ilike.%${processedSearchWithoutDash}%`,
  ].join(',');
};
