import {Database} from '../database.types';

export type ActionImpact = Database['public']['Tables']['action_impact']['Row'];
export type ActionImpactStatut = Database['public']['Tables']['action_impact_statut']['Row'];
export type ActionImpactState =
  {
    action: ActionImpact,
    isinpanier: boolean,
    statut: ActionImpactStatut | null
  };
export type Categorie = Database['public']['Tables']['action_impact_categorie']['Row']

export type Panier =
/* Le panier en tant que tel */
  Database['public']['Tables']['panier']['Row'] & {
  /* Liste des actions ajoutée au panier */
  contenu: ActionImpact[],
  /* Liste de toutes les actions avec leurs states. */
  states: ActionImpactState[]
}

export type Niveau = {niveau: number, nom: string};

/**
 * On sélectionne toutes les colonnes du panier : *
 * puis les `action_impact` par la relation `action_impact_panier` que l'on renomme `contenuPanier`
 */
export const panierSelect = '*, contenu:action_impact!action_impact_panier(*), states:action_impact_state(*)';
