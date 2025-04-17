import { CollectiviteEngagee } from '@/api';
import { NB_CARDS_PER_PAGE } from '@/app/app/pages/CollectivitesEngagees/data/utils';
import { trpc } from '@/api/utils/trpc/client';

/**
 * Renvoi une liste de plans en fonction d'un ensemble de filtres
 */
export const useFilteredPlans = (args: CollectiviteEngagee.Filters) => {

  const { data, isLoading } = trpc.collectivites.recherches.plans.useQuery({
    ...args,
    nbCards: NB_CARDS_PER_PAGE,
    nom: Array.isArray(args.nom) ? (args.nom[0] || '') : args.nom || ''
  });

  return {
    isLoading,
    plans: data?.items || [],
    plansCount: data?.count || 0,
  };
};
