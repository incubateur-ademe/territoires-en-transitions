/* eslint-disable @typescript-eslint/ban-types */
type OptionValue = number | string;

interface EventProperties
  extends Record<
    string,
    string | number | null | boolean | OptionValue[] | undefined
  > {}

interface Events extends Record<string, EventProperties> {}

interface Page {
  properties: EventProperties;
  events: Events;
  onglets: string;
}

/**
 * La liste des pages
 */
export type PageName = keyof TrackingPlan;

/** Propriétés d'une page */
export type PageProperties<N extends PageName> = (TrackingPlan[N]['properties'] extends object
? TrackingPlan[N]['properties']
: undefined);

/**
 * Liste des onglets de la page panier
 */
export type PanierOngletName = 'selection' | 'réalisées' | 'en cours';

/** Pour le tracking de page sans données additionnelles */
type NoProps = {
  properties: undefined;
  onglets: never;
  events: never;
};

/** Pour le tracking des écrans d'authent. */
type PageWithSubmitButton = {
  properties: undefined;
  onglets: never;
  events: {cta_submit: {}};
};
/** et le tracking des écrans avec les onglets avec/sans mdp */
type AuthPageAvecOnglets = {
  properties: undefined;
  onglets: 'sans_mdp' | 'avec_mdp';
  events: {cta_submit: {}};
};

type OpenDataSource = {
  source_id: string;
  type: 'resultat' | 'objectif';
};

/**
 * Permet de respecter le plan de tracking.
 */
export interface TrackingPlan extends Record<never, Page> {
  /** Page indicateur perso */
  'app/indicateurs/perso': {
    properties: {collectivite_id: number};
    onglets: never;
    events: {
      indicateur_suppression: {indicateur_id: number};
    };
  };

  /** Page indicateur prédéfini */
  'app/indicateurs/predefini': {
    properties: {collectivite_id: number; indicateur_id: string};
    onglets: never;
    events: {
      /** Consultation des données open data par fournisseur */
      view_open_data: OpenDataSource;
      /** Applique une source open data aux résultats ou objectifs */
      apply_open_data: OpenDataSource & {overwrite: boolean};
    };
  };

  /** Modale qui affiche les données open-data en conflits avec les données déjà saisies */
  'app/indicateurs/predefini/conflits': {
    properties: {collectivite_id: number; indicateur_id: string};
    onglets: never;
    events: never;
  };

  /* La page à la racine de https://auth.territoiresentransitions.fr */
  'auth/': NoProps;

  /* La 1ère étape du login (avec ou sans mdp) */
  'auth/login': AuthPageAvecOnglets;
  /** Formulaire de demande d'un code OTP pour réinitialiser le mdp */
  'auth/login/mdp_oublie': PageWithSubmitButton;
  /** Formulaire de saisie du nouveau mdp */
  'auth/login/reset_mdp': PageWithSubmitButton;

  /* La 1ère étape de la création de compte (avec ou sans mdp) */
  'auth/signup': AuthPageAvecOnglets;
  /** Saisie des informations complémentaires pour la création de compte */
  'auth/signup/dcp': PageWithSubmitButton;

  /** Vérification du code OTP pour pouvoir réinitialiser le mdp */
  'auth/verify_otp/reset_password': PageWithSubmitButton;
  /** Vérification du code OTP pour la connexion sans mdp  */
  'auth/verify_otp/login': PageWithSubmitButton;
  /** Vérification du code OTP pour la création de compte  */
  'auth/verify_otp/signup': PageWithSubmitButton;

  /** Demande le renvoi d'un code OTP pour pouvoir réinitialiser le mdp */
  'auth/resend_otp/reset_password': PageWithSubmitButton;
  /** Demande le renvoi d'un code OTP pour la connexion sans mdp  */
  'auth/resend_otp/login': PageWithSubmitButton;
  /** Demande le renvoi d'un code OTP pour la création de compte  */
  'auth/resend_otp/signup': PageWithSubmitButton;

  /** Page "rejoindre une collectivité" */
  'auth/rejoindre-une-collectivite': PageWithSubmitButton;

  /* La page à la racine de https://panier.territoiresentransitions.fr */
  'panier/': NoProps;

  /* La landing générique, qui crée et renvoie sur un nouveau panier */
  'panier/landing': {
    properties: undefined;
    onglets: never;
    events: {
      cta_panier_click: {};
    };
  };

  /* La landing pour une collectivité, qui crée et renvoie sur un panier récent ou un nouveau panier. */
  'panier/landing/collectivite': {
    properties: {
      collectivite_preset: number;
    };
    onglets: never;
    events: {
      /* Le bouton "c'est parti" */
      cta_panier_click: Record<PropertyKey, never>;
    };
  };

  /* La page d'un panier d'action */
  'panier/panier': {
    /* les propriétés de tous événements de la page panier */
    properties: {
      collectivite_preset: number | null;
      panier_id: string;
    };

    /* les onglets principaux */
    onglets: PanierOngletName;

    /* les events du panier */
    events: {
      /* Ajoute une action au panier */
      ajout: {
        action_id: number;
      };
      /* Retire une action au panier */
      retrait: {
        action_id: number;
      };
      /* Change le statut d'une action */
      statut: {
        action_id: number;
        category_id: string | null;
      };
      /* Le bouton "valider la création" affiché dans le panier */
      cta_valider_creation_panier_click: {};
      /* Le bouton "créer le plan d'action" affiché dans la modale */
      cta_creer_le_plan_click: {};
      /* Les valeurs des filtres  */
      filtre: {
        thematique_ids?: OptionValue[];
        niveau_budget_ids?: OptionValue[];
        niveau_temps_ids?: OptionValue[];
        match_competences?: boolean;
      };
    };
  };
}
