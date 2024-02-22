import {Database} from '../database.types';

export type ActionImpactCategorie =
  Database['public']['Tables']['action_impact_categorie']['Row'];

export type ActionImpactThematique = Omit<
  Database['public']['Tables']['thematique']['Row'],
  'md_id'
>;

export type Niveau = {niveau: number; nom: string};

export type ActionImpactFourchetteBudgetaire =
  Database['public']['Tables']['action_impact_fourchette_budgetaire']['Row'];

export type FNV = Database['public']['Tables']['categorie_fnv']['Row'];

export type ActionImpact = Database['public']['Tables']['action_impact']['Row'];

/* Le resumé d'une action à impact, utilisé pour les cartes  */
export type ActionImpactSnippet =
  // todo: Omit<ActionImpact, 'description' | 'ressources_externes'>
  ActionImpact & {thematiques: ActionImpactThematique[]};

/* Une action à impact avec des informations complémentaires, utilisé par la modale */
export type ActionImpactDetails = ActionImpact & {
  thematiques: ActionImpactThematique[];
} & {categoriesFNV: FNV[]};

export type ActionImpactStatut =
  Database['public']['Tables']['action_impact_statut']['Row'];

export type ActionImpactState = {
  action: ActionImpact;
  isinpanier: boolean;
  statut: ActionImpactStatut | null;
};

export type Panier =
  /* Le panier en tant que tel */
  Database['public']['Tables']['panier']['Row'] & {
    /* Liste des actions ajoutée au panier */
    contenu: ActionImpactSnippet[];
    /* Liste de toutes les actions avec leurs states. */
    states: ActionImpactState[];
  };
