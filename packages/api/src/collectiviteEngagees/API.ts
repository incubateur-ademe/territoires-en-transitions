import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../database.types';
import { Filters, TPlanCarte } from './types';

export class API {
  protected supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Télécharge les plans en fonction des filtres.
   */
  async fetchPlans(filters: Filters, limit: number) {
    const from = this.supabase.from('axe');

    const query = from
      .select(
        '*, type: plan_action_type, collectivite: collectivite_card!inner(*)',
        { count: 'exact' }
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
      query.range(limit * (filters.page - 1), limit * filters.page - 1);
    }

    query.order('collectivite(nom)');
    query.limit(limit);

    const { error, data, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return {
      plans: (data as unknown as TPlanCarte[]) || [],
      plansCount: count ?? 0,
    };
  }
}
