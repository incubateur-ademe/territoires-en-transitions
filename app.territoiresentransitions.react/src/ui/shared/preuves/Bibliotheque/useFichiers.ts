import {supabaseClient} from 'core-logic/api/supabase';
import {useQuery} from 'react-query';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TBibliothequeFichier} from './types';

export const NB_ITEMS_PER_PAGE = 5;

export type TFilters = {search: string; page: number};
type TFetchedData = {items: TBibliothequeFichier[]; total: number};

/**
 * Donne la liste de tous les fichiers de la collectivité, éventuellement
 * filtrée pour ne conserver que ceux dont le nom correspond à une chaîne de
 * recherche
 */
export const useFichiers = (filters: TFilters) => {
  const collectivite_id = useCollectiviteId();
  const {data} = useQuery(
    ['bibliotheque_fichier', collectivite_id, filters],
    () => (collectivite_id ? fetch(collectivite_id, filters) : null)
  );

  return data;
};

// charge les données
const fetch = async (
  collectivite_id: number,
  filters: TFilters
): Promise<TFetchedData> => {
  const {search, page} = filters;

  // lit la liste des fichiers de la collectivité
  const query = supabaseClient
    .from<TBibliothequeFichier>('bibliotheque_fichier')
    .select('id,filename,filesize,hash', {count: 'exact'})
    .eq('collectivite_id', collectivite_id)
    .range(NB_ITEMS_PER_PAGE * (page - 1), NB_ITEMS_PER_PAGE * page - 1);

  // éventuellement filtrée par nom de fichier
  if (search) {
    query.ilike('filename', `%${search}%`);
  }

  const {data, count, error} = await query;
  if (error) {
    throw new Error(error.message);
  }

  return {items: data || [], total: count || 0};
};

/**
 * Renvoie les fichiers correspondants au tableau de clés de hachage donné.
 * Permet de vérifier l'existence des fichiers pour éviter le téléversement de doublons.
 */
export const getFilesPerHash = async (
  collectivite_id: number,
  hashes: string[]
) => {
  const query = supabaseClient
    .from<TBibliothequeFichier>('bibliotheque_fichier')
    .select('id,filename,filesize,hash')
    .eq('collectivite_id', collectivite_id)
    .in('hash', hashes);

  const {data, error} = await query;

  if (error) {
    return null;
  }

  return (data as TBibliothequeFichier[]) || null;
};
