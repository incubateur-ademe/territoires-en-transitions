import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getTrpcClient, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

export const NB_ITEMS_PER_PAGE = 5;

export type TFilters = { search: string; page: number };

/**
 * Donne la liste de tous les fichiers de la collectivité, éventuellement
 * filtrée pour ne conserver que ceux dont le nom correspond à une chaîne de
 * recherche
 */
export const useFichiers = (filters: TFilters) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();
  const { search, page } = filters;

  return useQuery(
    trpc.collectivites.documents.list.queryOptions(
      {
        collectiviteId,
        filenameContains: search || undefined,
        page,
        limit: NB_ITEMS_PER_PAGE,
      },
      {
        enabled: !!collectiviteId,
        placeholderData: keepPreviousData,
        select: (data) => ({
          items: data.data,
          total: data.count,
        }),
      }
    )
  );
};

/**
 * Renvoie les fichiers correspondants au tableau de clés de hachage donné.
 * Permet de vérifier l'existence des fichiers pour éviter le téléversement de doublons.
 */
export const getFilesPerHash = async (
  collectivite_id: number,
  hashes: string[]
) => {
  if (!hashes.length) {
    return [];
  }

  const trpcClient = getTrpcClient();
  const data = await trpcClient.collectivites.documents.list.query({
    collectiviteId: collectivite_id,
    hashes,
    page: 1,
    limit: hashes.length,
  });
  return data.data;
};
