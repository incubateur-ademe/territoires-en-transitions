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

export type ActionImpactTempsMiseEnOeuvre =
  Database['public']['Tables']['action_impact_temps_de_mise_en_oeuvre']['Row'];

export type FNV = Database['public']['Tables']['categorie_fnv']['Row'];

export type Link = {
  url: string;
  label: string;
};

export type ActionImpact = Omit<
  Database['public']['Tables']['action_impact']['Row'],
  'rex' | 'ressources_externes' | 'subventions_mobilisables'
> & {
  rex: Link[];
  ressources_externes: Link[];
  subventions_mobilisables: Link[];
};

/* Le resumé d'une action à impact, utilisé pour les cartes  */
export type ActionImpactSnippet =
  // todo: Omit<ActionImpact, 'description' | 'ressources_externes'>
  ActionImpact & {
    thematiques: ActionImpactThematique[];
  };

/* Une action à impact avec des informations complémentaires, utilisé par la modale */
export type ActionImpactDetails = ActionImpact & {
  thematiques: ActionImpactThematique[];
} & {categoriesFNV: FNV[]};

export type ActionImpactStatut =
  Database['public']['Tables']['action_impact_statut']['Row'];

export type ActionReferentiel = {
  identifiant: string;
  referentiel: string;
  nom: string;
};

export type ActionImpactState = {
  action: ActionImpact;
  isinpanier: boolean;
  statut: ActionImpactStatut | null;
  thematiques: ActionImpactThematique[];
  actions_liees: ActionReferentiel[] | null;
  matches_competences: boolean;
  dejaImportee?: boolean;
};


export type PanierBase = Database['public']['Tables']['panier']['Row'];

export type Panier =
  /* Le panier en tant que tel */
  PanierBase & {
    /* Liste des actions ajoutée au panier */
    contenu: ActionImpactSnippet[];
    /* Liste de toutes les actions avec leurs states. */
    states: ActionImpactState[];
  };

export type MaCollectivite = {
  collectivite_id: number;
  nom: string;
  niveau_acces: Database['public']['Enums']['niveau_acces'];
  est_auditeur: boolean;
};

export type MesCollectivite = MaCollectivite[];
