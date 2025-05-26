import { VerificationTrajectoireStatus } from '@/domain/indicateurs';
import { CountByPropertyEnumType } from '@/domain/plans/fiches';

/* eslint-disable @typescript-eslint/ban-types */
type OptionValue = number | string;

type EventProperties = Record<
  string,
  string | number | null | boolean | OptionValue[] | undefined
>;

type Events = Record<string, EventProperties>;

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
export type PageProperties<N extends PageName> =
  TrackingPlan[N]['properties'] extends object
    ? TrackingPlan[N]['properties']
    : undefined;

/**
 * Liste des onglets de la page panier
 */
export type PanierOngletName =
  | 'selection'
  | 'réalisées'
  | 'en cours'
  | 'importees';

type RecherchesOngletName = 'collectivites' | 'referentiels' | 'plans';

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
  events: { cta_submit: {} };
};
/** et le tracking des écrans avec les onglets avec/sans mdp */
type AuthPageAvecOnglets = {
  properties: undefined;
  onglets: 'sans_mdp' | 'avec_mdp';
  events: { cta_submit: {} };
};

type OpenDataSource = {
  sourceId: string;
  type: 'resultat' | 'objectif';
};

type IndicateursFiltres = {
  thematiqueIds?: OptionValue[];
  actionId?: string;
  planActionIds?: OptionValue[];
  utilisateurPiloteIds?: OptionValue[];
  personnePiloteIds?: OptionValue[];
  servicePiloteIds?: OptionValue[];
  categorieNoms?: OptionValue[];
  participationScore?: boolean;
  estComplet?: boolean;
  estConfidentiel?: boolean;
  fichesNonClassees?: boolean;
  text?: string;
  estPerso?: boolean;
  hasOpenData?: boolean;
};

type FichesActionFiltres = {
  budgetPrevisionnel?: boolean;
  restreint?: boolean;
  hasIndicateurLies?: boolean;
  noPilote?: boolean;
  noServicePilote?: boolean;
  noStatut?: boolean;
};

type EventsGraphReferentiel = {
  zoom_graph: {
    referentiel: string;
    type: 'points' | 'percentage' | 'phase';
  };
  export_graph: {
    referentiel: string;
    type: 'points' | 'percentage' | 'phase';
  };
};

type CollectiviteDefaultProps = {
  collectiviteId: number;
  niveauAcces: string | null;
  role: 'auditeur' | null;
};

export const Event = {
  auth: {
    submitRejoindreCollectivite: 'cta_submit',
    submitForgottenPassword: 'cta_submit',
    submitLogin: 'cta_submit',
    submitResetPassword: 'cta_submit',
    submitResendMessage: 'cta_submit',
    submitSignup: 'cta_submit',
    submitSignupDcp: 'cta_submit',
    submitVerifyOTP: 'cta_submit',
  },
  updateFiltres: 'filtres',
  saveScore: 'referentiel_score_save',
  paginationClick: 'pagination_click',
  panier: {
    createPlanClick: 'cta_creer_le_plan_click',
    ctaPanierClick: 'cta_panier_click',
    filtre: 'panier:filtre',
    copierPanierUrl: 'copier_panier_URL',
    clickAjout: 'ajout',
    clickRetrait: 'retrait',
    changeStatut: 'statut',
    validerCreationPanierClick: 'cta_valider_creation_panier_click',
  },
  indicateurs: {
    createIndicateurPerso: 'cta_indicateur_perso_fa',
    downloadXlsx: 'export_xlsx_telechargement',
    deleteIndicateur: 'indicateur_suppression',
    viewIndicateursList: 'explorerIndicateursClick',
  },
  plans: {
    sideNavAjouterPlanClick: 'plansAction:side-nav-ajouter-plan-click',
    createPlan: 'cta_creer',
    importPlan: 'cta_importer',
    startPanier: 'cta_commencer_pai',
    exportPlan: 'export_plan',
  },
  fiches: {
    updatePilotesGroupe: 'editer_personne_pilote_groupe',
    updatePlanningGroupe: 'associer_planning_groupe',
    updatePrioriteGroupe: 'associer_priorite_groupe',
    updateStatutGroupe: 'associer_statut_groupe',
    updateTagsLibresGroupe: 'associer_tags_perso_groupe',
    exportPdf: 'export_PDF',
    exportPdfGroupe: 'export_PDF_telechargement_groupe',
    updateActeurs: 'validation_modale_acteurs_fa',
    updateDescription: 'validation_modale_modifier_fa',
    updatePlanning: 'validation_modale_planning_fa',
    viewImpactInfo: 'cta_fa_fai',
    downloadModele: 'cta_telecharger_modele',
  },
  trajectoire: {
    selectIndicateur: 'indicateurs_trajectoire_snbc_select',
    selectSecteur: 'selection_secteur',
    downloadSnbcFile: 'indicateurs_trajectoire_snbc_file_download',
    triggerSnbcCalculation: 'indicateurs_trajectoire_snbc_calculation_trigger',
  },
  tdb: {
    updateFiltresIndicateurs: 'tdb_modifier_filtres_indicateurs',
    updateFiltresActionsPilotes: 'tdb_modifier_filtres_actions_pilotes',
    updateFiltresActionsModifiees: 'tdb_modifier_filtres_actions_modifiees',
    updateFiltresCountByActions: 'tdb_modifier_filtres_count_by_actions',
    updateFiltresSuiviPlans: 'tdb_modifier_filtres_suivi_plans',
    validateFiltresIndicateurs: 'tdb_valider_filtres_indicateurs',
    validateModulePerso: 'tdb_valider_module_perso',
    validateFiltresActionsPilotes: 'tdb_valider_filtres_actions_pilotes',
    validateFiltresActionsModifiees: 'tdb_valider_filtres_actions_modifiees',
  },
  recherches: {
    updateFiltresTypePlan: 'collectivites_onglet_pa:filtre_type_pa_select',
    updateFiltresLabellisation:
      'collectivites_onglet_referentiels:filtre_labellisation_select',
    viewContacts: 'collectivites:voir_contacts_click',
    viewCollectivite: 'collectivites_onglet_collectivites:cartes_click',
    viewPlan: 'collectivites_onglet_pa:cartes_click',
    viewReferentiel: 'collectivites_onglet_referentiels:cartes_click',
  },
  referentiels: {
    exportScore: 'export_score',
    exportAuditScore: 'export_audit_score',
    viewIndicateurs: 'view_indicateurs_click',
    viewLabellisation: 'cta_labellisation',
    startEtatLieux: 'cta_edl_commencer',
    personalizeReferentiel: 'cta_edl_personnaliser',
  },
  viewGraphZoom: 'zoom_graph',
  downloadGraph: 'export_graph',
  togglePanel: 'panneau_lateral_toggle',
  toggleNavigationLaterale: 'navigation_laterale_toggle',
  accueil: {
    viewSyntheseEtatLieux: 'accueil:edl_synthese_click',
    viewMoreInfos: 'accueil:edl_plus_infos_click',
    viewTableauDeBordPersonnel: 'accueil:PA_mon_suivi_personnel_click',
    viewTableauDeBordCollectivite:
      'accueil:PA_tableau_de_bord_collectivite_click',
    createPlan: 'accueil:PA_creer_plan_click',
    createFiche: 'accueil:PA_creer_fiche_click',
    viewToutesLesFiches: 'accueil:PA_toutes_les_fiches_click',
    viewTousLesIndicateurs: 'accueil:indicateurs_tous_click',
    viewIndicateursOpenData: 'accueil:indicateurs_open_data_click',
    viewTrajectoires: 'accueil:trajectoires_decouvrir_click',
    viewCollectivites: 'accueil:collectivites_inspiration_click',
    viewCollectivitesConfidentialite:
      'accueil:collectivites_confidentialite_click',
    viewPanierActions: 'accueil:panier_actions_tester_click',
    viewSite: 'accueil:retourner_site_click',
  },
} as const;

// Get all values of nested objects (i.e filtres_update)
export type EventName = {
  [K in keyof typeof Event]: (typeof Event)[K] extends Record<string, unknown>
    ? (typeof Event)[K][keyof (typeof Event)[K]]
    : (typeof Event)[K];
}[keyof typeof Event];

/**
 * Permet de respecter le plan de tracking.
 */
export interface TrackingPlan extends Record<never, Page> {
  'app/accueil': {
    properties: {};
    onglets: never;
    events: {
      'accueil:edl_synthese_click': {};
      'accueil:edl_plus_infos_click': {};
      'accueil:PA_mon_suivi_personnel_click': {};
      'accueil:PA_tableau_de_bord_collectivite_click': {};
      'accueil:PA_creer_plan_click': {};
      'accueil:PA_creer_fiche_click': {};
      'accueil:PA_toutes_les_fiches_click': {};
      'accueil:indicateurs_tous_click': {};
      'accueil:indicateurs_open_data_click': {};
      'accueil:trajectoires_decouvrir_click': {};
      'accueil:collectivites_inspiration_click': {};
      'accueil:collectivites_confidentialite_click': {};
      'accueil:panier_actions_tester_click': {};
      'accueil:retourner_site_click': {};
    };
  };
  'app/edl/synthese': {
    properties: CollectiviteDefaultProps;
    onglets: never;
    events: EventsGraphReferentiel;
  };

  'app/audit/comparaison': {
    properties: CollectiviteDefaultProps;
    onglets: never;
    events: EventsGraphReferentiel;
  };

  /** Page "Liste des indicateurs" */
  'app/indicateurs/tous': {
    properties: CollectiviteDefaultProps;
    onglets:
      | 'cles'
      | 'perso'
      | 'collectivite' // favoris de la collectivité
      | 'mes-indicateurs'
      | 'tous';
    events: {
      toggle_graphique: { actif: boolean };
      export_xlsx_telechargement: {};
      explorerIndicateursClick: {};
      filtres: {
        filtreValues: IndicateursFiltres;
      };
    };
  };

  /** Page indicateur perso */
  'app/indicateurs/perso': {
    properties: CollectiviteDefaultProps;
    onglets: never;
    events: {
      indicateur_suppression: { indicateur_id: number };
      export_xlsx_telechargement: {};
    };
  };

  /** Page indicateur prédéfini */
  'app/indicateurs/predefini': {
    properties: CollectiviteDefaultProps & { indicateurId: string };
    onglets: never;
    events: {
      /** Consultation des données open data par fournisseur */
      view_open_data: OpenDataSource;
      /** Applique une source open data aux résultats ou objectifs */
      apply_open_data: OpenDataSource & { overwrite: boolean };
      export_xlsx_telechargement: {};
    };
  };

  /** Modale qui affiche les données open-data en conflits avec les données déjà saisies */
  'app/indicateurs/predefini/conflits': {
    properties: CollectiviteDefaultProps & { indicateurId: string };
    onglets: never;
    events: never;
  };

  /** Page tableau de bord de la collectivité */
  'app/tdb/collectivite': {
    properties: CollectiviteDefaultProps;
    onglets: never;
    events: {
      // clic sur le bouton "éditer" de chaque module
      tdb_modifier_filtres_count_by_actions: {
        countByProperty: CountByPropertyEnumType;
      };
      tdb_valider_module_perso: { countByProperty: CountByPropertyEnumType };
      tdb_modifier_filtres_suivi_plans: {};
    };
  };

  /** Page tableau de bord personnel */
  'app/tdb/personnel': {
    properties: CollectiviteDefaultProps;
    onglets: never;
    events: {
      // clic sur le bouton "éditer" de chaque module
      tdb_modifier_filtres_indicateurs: {};
      tdb_modifier_filtres_actions_pilotes: {};
      tdb_modifier_filtres_actions_modifiees: {};
    };
  };

  /** Page TDB "indicateurs de suivi de mes plans" */
  'app/tdb/personnel/indicateurs-de-suivi-de-mes-plans': {
    properties: CollectiviteDefaultProps;
    onglets: never;
    events: {
      tdb_modifier_filtres_indicateurs: {};
      tdb_valider_filtres_indicateurs: {};
      export_xlsx_telechargement: {};
    };
  };

  /** Page TDB “actions dont je suis le pilote" */
  'app/tdb/personnel/actions-dont-je-suis-pilote': {
    properties: CollectiviteDefaultProps;
    onglets: never;
    events: {
      tdb_modifier_filtres_actions_pilotes: {};
      tdb_valider_filtres_actions_pilotes: {};
    };
  };

  /** Page TDB "actions récemment modifiées" */
  'app/tdb/personnel/actions-recemment-modifiees': {
    properties: CollectiviteDefaultProps;
    onglets: never;
    events: {
      tdb_modifier_filtres_actions_modifiees: {};
      tdb_valider_filtres_actions_modifiees: {};
    };
  };

  /** Page TDB "avancement des fiches action" */
  'app/tdb/collectivite/fiche-actions-par-statut': {
    properties: CollectiviteDefaultProps;
    onglets: never;
    events: {
      tdb_modifier_filtres_avancement_actions: {};
    };
  };

  /** Page TDB "suivi des plans d'actions" */
  'app/tdb/collectivite/suivi-plan-actions': {
    properties: CollectiviteDefaultProps;
    onglets: never;
    events: {
      tdb_modifier_filtres_suivi_plan_actions: {};
    };
  };

  /** Page fiche action */
  'app/fiche-action': {
    properties: CollectiviteDefaultProps;
    onglets: never;
    events: {
      validation_modale_modifier_fa: {};
      validation_modale_acteurs_fa: {};
      validation_modale_planning_fa: {};
      cta_indicateur_perso_fa: {};
      cta_fa_fai: {};
      export_PDF: { sections: string[] };
    };
  };

  /** Page toutes les fiches action */
  'app/toutes-les-fiches-action': {
    properties: CollectiviteDefaultProps;
    onglets: never;
    events: {
      filtres: {
        filtreValues: FichesActionFiltres;
      };
    };
  };

  /** Actions groupées sur les fiches actions */
  'app/actions-groupees-fiches-action': {
    properties: CollectiviteDefaultProps;
    onglets: never;
    events: {
      editer_personne_pilote_groupe: {};
      associer_statut_groupe: {};
      associer_priorite_groupe: {};
      associer_planning_groupe: {};
      associer_tags_perso_groupe: {};
      export_PDF_telechargement_groupe: { sections: string[] };
    };
  };

  /** Page "créer un plan" */
  'app/creer-plan': {
    properties: CollectiviteDefaultProps;
    onglets: never;
    events: {
      cta_creer: {};
      cta_importer: {};
      cta_commencer_pai: {};
      cta_telecharger_modele: { format: string };
    };
  };

  /**
   * Match toutes les pages du pilier plan d'action.
   * Permet de tracker des événements communs à plusieurs pages
   * comme le bouton "Ajouter un plan d'action".
   */
  'app/plans': {
    properties: CollectiviteDefaultProps;
    onglets: never;
    events: {
      'plansAction:side-nav-ajouter-plan-click': {};
    };
  };

  /** Trajectoire SNBC territorialisée */
  'app/trajectoires/snbc': {
    properties: CollectiviteDefaultProps &
      (
        | {
            statut: VerificationTrajectoireStatus;
          }
        | { statut: 'error'; error?: string; statusCode?: number }
        | { statut?: undefined }
      );
    onglets: 'emissions_ges' | 'consommations_finales';
    events: {
      cta_lancer_calcul: { source: 'open_data' | 'collectivite' };
      cta_download: { file: 'modele' | 'donnees' | 'methodo' };
      selection_secteur: { secteur: string };
    };
  };

  /** Page toutes les collectivités */
  'app/recherches': {
    properties: CollectiviteDefaultProps;
    onglets: RecherchesOngletName;
    events: {
      'collectivites:voir_contacts_click': {};
      'collectivites_onglet_collectivites:cartes_click': {};
      'collectivites_onglet_referentiels:cartes_click': {};
      'collectivites_onglet_referentiels:filtre_labellisation_select': {
        labellisation: string[];
      };
      'collectivites_onglet_pa:cartes_click': {};
      'collectivites_onglet_pa:filtre_type_pa_select': { plan: string[] };
    };
  };

  /** Page "Gestion des membres de la collectivité" */
  'app/parametres/membres': {
    properties: CollectiviteDefaultProps;
    onglets: never;
    events: never;
  };

  /** Page "journal de bord de la collectivité" */
  'app/parametres/historique': {
    properties: CollectiviteDefaultProps;
    onglets: never;
    events: never;
  };

  /** Page "Bibliothèque de documents de la collectivité" */
  'app/parametres/bibliotheque': {
    properties: CollectiviteDefaultProps;
    onglets: never;
    events: never;
  };

  /** Modale "Figer un référentiel" */
  'app/referentiel': {
    properties: CollectiviteDefaultProps;
    onglets: never;
    events: {
      'referentiels:scores:sauvegarde': { dateDuJour: boolean };
    };
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

  /** Modale d'envoi d'une invitation à rejoindre une collectivité */
  'auth/invite': PageWithSubmitButton;

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
      /** Bouton "copier le lien du panier" */
      copier_panier_URL: {};
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
