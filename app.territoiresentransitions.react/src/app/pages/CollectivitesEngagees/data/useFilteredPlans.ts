import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {Tfilters} from 'app/pages/CollectivitesEngagees/data/filters';
import {TCollectiviteCarte} from 'app/pages/CollectivitesEngagees/data/useFilteredCollectivites';
import {NB_CARDS_PER_PAGE} from 'app/pages/CollectivitesEngagees/data/utils';
import {PlanType} from 'app/pages/collectivite/PlansActions/PlanAction/data/types';

/**
 * Element de la liste `collectivite_card`, utilisée par la vue toutes les
 * collectivités.
 */
export type TPlanCarte = PlanType & {
  collectivite: TCollectiviteCarte;
};

/**
 * Renvoi une liste de plans en fonction d'un ensemble de filtres
 */
export const useFilteredPlans = (args: Tfilters) => {
  const {data, isLoading} = useQuery(['plan_card', args], () =>
    fetchPlans(args)
  );

  return {
    isLoading,
    plans: data?.plans || [],
    plansCount: data?.plansCount || 0,
  };
};

/**
 * Télécharge les plans en fonction des filtres.
 */
const fetchPlans = async (filters: Tfilters) => {
  // la requête
  const query = buildQueryFromFilters(filters);

  // attends les données
  const {error, data, count} = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    plans: (data as unknown as TPlanCarte[]) || [],
    plansCount: count ?? 0,
  };
};

/**
 * Construit la query en ajoutant des opérateurs Postgrest pour chaque filtre.
 */
const buildQueryFromFilters = (filters: Tfilters) => {
  const query = supabaseClient
    .from('axe')
    .select(
      '*, type: plan_action_type, collectivite: collectivite_card!inner(*).order=collectivite_card.nom',
      {count: 'exact'}
    )
    .not('collectivite_card', 'is', null)
    .is('parent', null)
    .is('vide', false);

  // Type de plan
  if (filters.typesPlan.length) {
    query.in('type', filters.typesPlan);
  }
  // Région de la collectivité
  if (filters.regions.length) {
    query.in('collectivite.region_code', filters.regions);
  }
  // Département de la collectivité
  if (filters.departments.length) {
    query.in('collectivite.departement_code', filters.departments);
  }
  // Type de la collectivité
  if (filters.typesCollectivite.length) {
    query.in('collectivite.type_collectivite', filters.typesCollectivite);
  }
  // Population de la collectivité
  if (filters.population.length) {
    query.in('collectivite.population_intervalle', filters.population);
  }
  // Nom de la collectivité
  if (filters.nom) {
    query.ilike('collectivite.nom', `%${filters.nom}%`);
  }

  // Pagination
  if (filters.page) {
    query.range(
      NB_CARDS_PER_PAGE * (filters.page - 1),
      NB_CARDS_PER_PAGE * filters.page - 1
    );
  }
  query.limit(NB_CARDS_PER_PAGE);
  return query;
};
