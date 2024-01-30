import {Database} from '../database.types';

export type Panier =
/* Le panier en tant que tel */
  Database['public']['Tables']['panier']['Row'] & {
  /* Liste d'actions */
  actions: Database['public']['Tables']['action_impact']['Row'][]
}

/**
 * On sélectionne toutes les colonnes du panier : *
 * puis les `action_impact` par la relation `action_impact_panier` que l'on renomme `actions`
 */
export const panierSelect = '*, actions:action_impact!action_impact_panier(*)';
