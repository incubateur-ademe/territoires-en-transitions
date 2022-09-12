import {supabaseClient} from 'core-logic/api/supabase';
import {useQuery} from 'react-query';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TFichier} from './types';

type TFichierCollectivite = Pick<TFichier, 'filename' | 'filesize' | 'hash'>;

/**
 * Donne la liste de tous les fichiers de la collectivité, éventuellement
 * filtrée pour ne conserver que ceux dont le nom correspond à une chaîne de
 * recherche
 */
export const useFichiers = (search?: string) => {
  const collectivite_id = useCollectiviteId();
  const {data} = useQuery(
    ['bibliotheque_fichier', collectivite_id, search],
    () => (collectivite_id ? fetch(collectivite_id, search) : [])
  );
  return data || [];
};

// charge les données
const fetch = async (collectivite_id: number, search?: string) => {
  // lit la liste des fichiers de la collectivité
  const query = supabaseClient
    .from<TFichier>('bibliotheque_fichier')
    .select('filename,filesize,hash')
    .eq('collectivite_id', collectivite_id);

  // éventuellement filtrées par action (et ses sous-actions)
  if (search) {
    query.ilike('filename', `%${search}%`);
  }
  const {data, error} = await query;

  if (error) {
    return [];
  }

  return data as TFichierCollectivite[];
};
