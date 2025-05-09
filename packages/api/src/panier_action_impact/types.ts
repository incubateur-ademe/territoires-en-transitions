import {Database} from '../database.types';

export type ActionImpactCategorie =
  Database['public']['Tables']['action_impact_categorie']['Row'];

export type ActionImpactThematique = Omit<
  Database['public']['Tables']['thematique']['Row'],
  'md_id'
> & { ordre: number };

export type ActionImpactTypologie =
  Database['public']['Tables']['action_impact_typologie']['Row'];

export type Niveau = {niveau: number; nom: string};

export type ActionImpactFourchetteBudgetaire =
  Database['public']['Tables']['action_impact_fourchette_budgetaire']['Row'];

export type ActionImpactTempsMiseEnOeuvre =
  Database['public']['Tables']['action_impact_temps_de_mise_en_oeuvre']['Row'];

export type Link = {
  url: string;
  label: string;
};

export type ActionImpactBase = Omit<
  Database['public']['Tables']['action_impact']['Row'],
  'rex' | 'ressources_externes' | 'subventions_mobilisables'
> & {
  rex: Link[];
  ressources_externes: Link[];
  subventions_mobilisables: Link[];
};

/* Une action à impact avec toutes les informations complémentaires */
export type ActionImpactDetails = Omit<
  ActionImpactBase,
  'fourchette_budgetaire' | 'temps_de_mise_en_oeuvre'
> & {
  thematiques: ActionImpactThematique[];
  typologie: ActionImpactTypologie;
  fourchette_budgetaire: ActionImpactFourchetteBudgetaire | null;
  temps_de_mise_en_oeuvre: ActionImpactTempsMiseEnOeuvre | null;
  actions_liees: ActionReferentiel[] | null;
};

/** Action complète + les informations d'état de celle-ci dans le panier */
export type ActionImpactFull = ActionImpactDetails & ActionImpactState;

export type ActionImpactStatut = 'en_cours' | 'realise' | null | undefined;

export type ActionReferentiel = {
  identifiant: string;
  referentiel: string;
  nom: string;
};

export type ActionImpactState = {
  statut: ActionImpactStatut;
  isinpanier?: boolean;
  dejaImportee?: boolean;
  matches_competences?: boolean;
};

export type PanierBase = Database['public']['Tables']['panier']['Row'];

export type Panier =
  /* Le panier en tant que tel */
  PanierBase & {
    /** toutes les actions */
    //    actions: ActionImpactFull[];
    /** sélection disponible après filtrage */
    selection: ActionImpactFull[];
    /** actions marquées "réalisées" */
    realise: ActionImpactFull[];
    /** actions marquées "en cours de réalisation" */
    en_cours: ActionImpactFull[];
    /** actions déjà importées dans au moins un plan de la collectivité */
    importees: ActionImpactFull[];
    /** actions ajoutées au panier */
    inpanier: ActionImpactFull[];
  };

export type MaCollectivite = {
  collectivite_id: number;
  nom: string;
  niveau_acces: Database['public']['Enums']['niveau_acces'];
  est_auditeur: boolean;
};

export type MesCollectivite = MaCollectivite[];

/** Options de filtrage */
export type FiltreAction = {
  thematique_ids?: number[];
  typologie_ids?: number[];
  niveau_budget_ids?: number[];
  niveau_temps_ids?: number[];
  matches_competences?: boolean;
};
