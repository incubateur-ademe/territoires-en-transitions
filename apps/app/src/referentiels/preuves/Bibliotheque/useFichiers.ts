import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { RouterOutput, TRPCUseQueryResult, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { createClientWithoutCookieOptions } from '@tet/api/utils/supabase/browser-client';
import { BibliothequeFichier } from './types';

const BIBLIOTHEQUE_DISPLAY_LIMIT = 5;

export type BibliothequeDocuments =
  RouterOutput['collectivites']['documents']['listBibliothequeDocuments'];
export type BibliothequeFichierListItem =
  BibliothequeDocuments['items'][number];

export type FichierParHash = Pick<
  BibliothequeFichier,
  'id' | 'filename' | 'filesize' | 'hash'
>;

export const useFichiers = (
  search: string
): TRPCUseQueryResult<BibliothequeDocuments> => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.collectivites.documents.listBibliothequeDocuments.queryOptions(
      { collectiviteId, search, limit: BIBLIOTHEQUE_DISPLAY_LIMIT },
      { placeholderData: keepPreviousData }
    )
  );
};

/**
 * Renvoie les fichiers correspondants au tableau de clés de hachage donné.
 * Permet de vérifier l'existence des fichiers pour éviter le téléversement de doublons.
 */
export const getFilesPerHash = async (
  collectiviteId: number,
  hashes: string[]
): Promise<FichierParHash[] | null> => {
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

  return (data ?? null) as FichierParHash[] | null;
};
