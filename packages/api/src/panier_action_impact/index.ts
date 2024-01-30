import {Database} from '../database.types';

export type Panier =
/* Le panier en tant que tel */
  Database['public']['Tables']['panier']['Row'] & {
  /* Liste d'actions */
  contenuPanier: Database['public']['Tables']['action_impact']['Row'][],
  /* Liste d'action et de states */
  actionStates: Database['public']['Tables']['action_impact_state']['Row'][]
}

/**
 * On sélectionne toutes les colonnes du panier : *
 * puis les `action_impact` par la relation `action_impact_panier` que l'on renomme `contenuPanier`
 */
export const panierSelect = '*, contenuPanier:action_impact!action_impact_panier(*), states:action_impact_state(*)';
