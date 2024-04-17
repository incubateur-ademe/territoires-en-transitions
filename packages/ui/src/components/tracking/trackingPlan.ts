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
export type PageName = PageNamePanier;

type PageNamePanier =
  | 'panier/'
  | 'panier/landing'
  | 'panier/landing/collectivite'
  | 'panier/panier';

/**
 * Liste des onglets de la page panier
 */
export type PanierOngletName = 'selection' | 'réalisées' | 'en cours';

/**
 * Permet de respecter le plan de tracking.
 */
export interface TrackingPlan extends Record<PageName, Page> {
  /* La page à la racine de https://panier.territoiresentransitions.fr */
  'panier/': {
    properties: never;
    onglets: never;
    events: never;
  };

  /* La landing générique, qui crée et renvoie sur un nouveau panier */
  'panier/landing': {
    properties: never;
    onglets: never;
    events: {
      cta_panier_click: {};
    };
  };

  /* La landing pour une collectivité, qui crée et renvoie sur un panier récent ou un nouveau panier. */
  'panier/landing/collectivite': {
    properties: {
      collectivite_id: number;
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
