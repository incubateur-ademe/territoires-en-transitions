import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { DBClient, useSupabase } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { createClientWithoutCookieOptions } from '@tet/api/utils/supabase/browser-client';
import { BibliothequeFichier } from './types';

export const NB_ITEMS_PER_PAGE = 5;

export type FichiersFilters = { search: string; page: number };
type FetchedData = { items: BibliothequeFichier[]; total: number };

/**
 * Donne la liste de tous les fichiers de la collectivité, éventuellement
 * filtrée pour ne conserver que ceux dont le nom correspond à une chaîne de
 * recherche
 */
export const useFichiers = (filters: FichiersFilters) => {
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['bibliotheque_fichier', collectiviteId, filters],
    queryFn: () =>
      collectiviteId ? fetch(supabase, collectiviteId, filters) : null,
    placeholderData: keepPreviousData,
  });
};

// charge les données
const fetch = async (
  supabase: DBClient,
  collectiviteId: number,
  filters: FichiersFilters
): Promise<FetchedData> => {
  const { search, page } = filters;

  // lit la liste des fichiers de la collectivité
  const query = supabase
    .from('bibliotheque_fichier')
    .select('id,filename,filesize,hash,confidentiel', { count: 'exact' })
    .eq('collectivite_id', collectiviteId)
    .order('filename', { ascending: true })
    .range(NB_ITEMS_PER_PAGE * (page - 1), NB_ITEMS_PER_PAGE * page - 1);

  // éventuellement filtrée par nom de fichier
  if (search) {
    query.ilike('filename', `%${search}%`);
  }

  const { data, count, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return { items: (data as BibliothequeFichier[]) || [], total: count || 0 };
};

/**
 * Renvoie les fichiers correspondants au tableau de clés de hachage donné.
 * Permet de vérifier l'existence des fichiers pour éviter le téléversement de doublons.
 */
export const getFilesPerHash = async (
  collectiviteId: number,
  hashes: string[]
) => {
  // TODO: replace with `useSupabase()`
  const supabase = createClientWithoutCookieOptions();

  const query = supabase
    .from('bibliotheque_fichier')
    .select('id,filename,filesize,hash')
    .eq('collectivite_id', collectiviteId)
    .in('hash', hashes);

  const { data, error } = await query;

  if (error) {
    return null;
  }

  return (data as BibliothequeFichier[]) || null;
};
