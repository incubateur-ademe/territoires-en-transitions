interface EventProperties extends Record<string, string | number | null> {}

interface Events extends Record<string, EventProperties> {}

interface Page {
  properties: EventProperties;
  events: Events;
  onglets: string;
}

/**
 * La liste des pages
 */
export type PageName = '/' | 'landing' | 'landing/collectivite' | 'panier';

/**
 * Permet de respecter le plan de tracking.
 */
export interface TrackingPlan extends Record<PageName, Page> {
  /* La page à la racine de https://panier.territoiresentransitions.fr */
  '/': {
    properties: never;
    onglets: never;
    events: never;
  };

  /* La landing générique, qui crée et renvoie sur un nouveau panier */
  landing: {
    properties: never;
    onglets: never;
    events: {
      cta_panier_click: {};
    };
  };

  /* La landing pour une collectivité, qui crée et renvoie sur un panier récent ou un nouveau panier. */
  'landing/collectivite': {
    properties: {
      collectivite_id: number;
    };
    onglets: never;
    events: {
      cta_panier_click: {};
    };
  };

  /* La page d'un panier d'action */
  panier: {
    /* les propriétés de tous événements de la page panier */
    properties: {
      collectivite_preset: number | null;
      panier_id: string;
    };

    /* les onglets principaux */
    onglets: 'selection' | 'réalisées' | 'en cours';

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
    };
  };
}
