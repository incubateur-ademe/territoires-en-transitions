import { CollectiviteEngagee } from '@/api';
import { useTRPC } from '@/api/utils/trpc/client';
import { useGetCardNumber } from '@/app/app/pages/CollectivitesEngagees/data/utils';
import { useQuery } from '@tanstack/react-query';

/**
 * Renvoi une liste de collectivités en fonction d'un ensemble de filtres
 */
export const useFilteredCollectivites = (args: CollectiviteEngagee.Filters) => {
  const trpc = useTRPC();
  const cardNumberToDisplay = useGetCardNumber();
  const { data, isLoading } = useQuery(
    trpc.collectivites.recherches.collectivites.queryOptions({
      ...args,
      nbCards: cardNumberToDisplay,
      nom: Array.isArray(args.nom) ? args.nom[0] || '' : args.nom || '',
      // TODO: Supprimer ce cast manuel quand on utilisera la lib `nuqs`
      // qui gérera automatiquement les cast de query params
      typesPlan: args.typesPlan.map((type) => Number(type)),
    })
  );

  return {
    isLoading,
    collectivites: data?.items || [],
    collectivitesCount: data?.count || 0,
  };
};
