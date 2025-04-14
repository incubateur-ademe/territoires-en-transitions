import { CollectiviteEngagee } from '@/api';
import { trpc } from '@/api/utils/trpc/client';
import { NB_CARDS_PER_PAGE } from '@/app/app/pages/CollectivitesEngagees/data/utils';

/**
 * Renvoi une liste de collectivités en fonction d'un ensemble de filtres
 */
export const useFilteredCollectivites = (args: CollectiviteEngagee.Filters) => {
  const { data, isLoading } =
    trpc.collectivites.recherches.collectivites.useQuery({
      ...args,
      nbCards: NB_CARDS_PER_PAGE,
      nom: Array.isArray(args.nom) ? args.nom[0] || '' : args.nom || '',
    });

  return {
    isLoading,
    collectivites: data?.items || [],
    collectivitesCount: data?.count || 0,
  };
};
