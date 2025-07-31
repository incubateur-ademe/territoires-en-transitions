import { CollectiviteEngagee } from '@/api';
import { useTRPC } from '@/api/utils/trpc/client';
import { NB_CARDS_PER_PAGE } from '@/app/app/pages/CollectivitesEngagees/data/utils';
import { useQuery } from '@tanstack/react-query';

/**
 * Renvoi une liste de plans en fonction d'un ensemble de filtres
 */
export const useFilteredPlans = (args: CollectiviteEngagee.Filters) => {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.collectivites.recherches.plans.queryOptions({
      ...args,
      nbCards: NB_CARDS_PER_PAGE,
      nom: Array.isArray(args.nom) ? args.nom[0] || '' : args.nom || '',
      // TODO: Supprimer ce cast manuel quand on utilisera la lib `nuqs`
      // qui gérera automatiquement les cast de query params
      typesPlan: args.typesPlan.map((type) => Number(type)),
    })
  );

  return {
    isLoading,
    plans: data?.items || [],
    plansCount: data?.count || 0,
  };
};
