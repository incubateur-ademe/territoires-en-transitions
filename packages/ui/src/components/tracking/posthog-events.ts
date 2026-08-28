/**
 * Méthode de connexion, portée par la propriété `methode` des événements
 * `auth:login:*` : c'est elle qui permet de comparer la connexion classique
 * (mot de passe, lien magique) à la connexion par fournisseur d'identité.
 */
export type LoginMethod = 'mot_de_passe' | 'lien_magique' | 'oidc';

export const Event = {
  auth: {
    // Les événements `cta_submit` sont historiques : un même nom pour tous les
    // formulaires, seule l'URL les distingue dans PostHog. Les événements
    // nommés ci-dessous (`auth:*`) les doublent avec un nom explicite et des
    // propriétés — ils ne sont pas retirés pour ne pas casser les tableaux de
    // bord existants.
    submitRejoindreCollectivite: 'cta_submit',
    submitForgottenPassword: 'cta_submit',
    submitLogin: 'cta_submit',
    submitResetPassword: 'cta_submit',
    submitResendMessage: 'cta_submit',
    submitSignup: 'cta_submit',
    submitSignupDcp: 'cta_submit',
    submitVerifyOTP: 'cta_submit',
    viewAvecMdp: 'onglet_avec_mdp',
    viewSansMdp: 'onglet_sans_mdp',
    /**
     * Connexion, toutes méthodes confondues : la propriété `methode`
     * (`LoginMethod`) distingue mot de passe, lien magique et fournisseur
     * d'identité, `provider` nomme ce dernier.
     */
    login: {
      /** Départ d'une connexion (soumission du formulaire ou clic ProConnect). */
      click: 'auth:login:click',
      /** Session ouverte. */
      success: 'auth:login:success',
      /** Échec (identifiants refusés, code invalide, erreur du fournisseur). */
      error: 'auth:login:error',
      /** Lien de connexion sans mot de passe envoyé par email. */
      magicLinkSent: 'auth:login:magic_link_sent',
    },
    /** Déconnexion (`methode` : `oidc` si la session SSO amont est fermée). */
    logout: 'auth:logout',
    signup: {
      click: 'auth:signup:click',
      /** Compte créé et profil complété. */
      success: 'auth:signup:success',
      /** Échec à l'une des étapes (`etape`). */
      error: 'auth:signup:error',
    },
    password: {
      resetRequested: 'auth:password:reset_requested',
      resetSuccess: 'auth:password:reset_success',
    },
    /** Liaison d'une identité de fournisseur d'identité à un compte TeT. */
    oidc: {
      /** Clic sur « associer » (`origine` : profil, bannière, modale). */
      linkClick: 'auth:oidc:link_click',
      /** Identité effectivement associée au compte. */
      linked: 'auth:oidc:linked',
      linkError: 'auth:oidc:link_error',
      unlinked: 'auth:oidc:unlinked',
      unlinkError: 'auth:oidc:unlink_error',
      /** Écran de bienvenue : réponse à « avez-vous déjà un compte ? ». */
      welcomeChoice: 'auth:oidc:welcome_choice',
      /** Repli « mot de passe oublié » : demande du mail de rattachement. */
      invitationRequested: 'auth:oidc:invitation_requested',
      /** Rattachement confirmé depuis le lien reçu par mail. */
      invitationConfirmed: 'auth:oidc:invitation_confirmed',
      /** Incitation à associer son compte (modale, bannière). */
      incentiveShown: 'auth:oidc:incentive_shown',
      incentiveDismissed: 'auth:oidc:incentive_dismissed',
      /** Erreur renvoyée par le parcours du fournisseur d'identité. */
      error: 'auth:oidc:error',
    },
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
    selectTab: 'onglet_panier',
  },
  indicateurs: {
    createIndicateurPerso: 'cta_indicateur_perso_fa',
    downloadXlsx: 'export_xlsx_telechargement',
    deleteIndicateur: 'indicateur_suppression',
    viewIndicateursList: 'explorerIndicateursClick',
    trajectoires: {
      secteurLevierClick: 'indicateurs:trajectoires:secteur_levier_click',
    },
  },
  plans: {
    sideNavAjouterPlanClick: 'plansAction:side-nav-ajouter-plan-click',
    createPlan: 'cta_creer',
    importPlan: 'cta_importer',
    startPanier: 'cta_commencer_pai',
    exportPlan: 'export_plan',
    import: {
      lancer: 'plans:import:lancer',
      resultat: 'plans:import:resultat',
    },
  },
  fiches: {
    updatePilote: {
      one: 'editer_personne_pilote',
      multiple: 'editer_personne_pilote_groupe',
    },
    updatePlanning: {
      one: 'associer_planning',
      multiple: 'associer_planning_groupe',
    },
    updatePriorite: {
      one: 'associer_priorite',
      multiple: 'associer_priorite_groupe',
    },
    updateStatut: {
      one: 'associer_statut',
      multiple: 'associer_statut_groupe',
    },
    updateTagsLibres: {
      one: 'associer_tags_perso',
      multiple: 'associer_tags_perso_groupe',
    },
    updateReferent: {
      one: 'editer_elu_referent',
      multiple: 'editer_elu_referent_groupe',
    },
    updateService: {
      one: 'editer_direction_pilote',
      multiple: 'editer_direction_pilote_groupe',
    },
    updateAcces: {
      one: 'collectivites_onglet_pa:editer_acces_click',
      multiple: 'collectivites_onglet_pa:editer_acces_groupe_click',
    },
    exportPdf: 'export_PDF',
    exportPdfGroupe: 'export_PDF_telechargement_groupe',
    updateActeurs: 'validation_modale_acteurs_fa',
    updateDescription: 'validation_modale_modifier_fa',
    updateModaleOuverture: 'modale:action:modification:ouverture',
    updateModaleValidation: 'modale:action:modification:valider',
    deleteModaleValidation: 'modale:action:suppression:valider',
    viewImpactInfo: 'cta_fa_fai',
    downloadModele: 'cta_telecharger_modele',
    listChangeView: {
      grid: 'plans:fiches:change_view_grid',
      table: 'plans:fiches:change_view_table',
      calendar: 'plans:fiches:change_view_calendar',
    },
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
    updateFiltresMesures: 'tdb_modifier_filtres_mesures',
    updateFiltresCountByActions: 'tdb_modifier_filtres_count_by_actions',
    validateFiltresIndicateurs: 'tdb_valider_filtres_indicateurs',
    validateFiltresMesures: 'tdb_valider_filtres_mesures',
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
    exportSingleSnapshotScore: 'export_single_snapshot_score',
    exportCurrentScore: 'export_current_score',
    exportComparisonScore: 'export_comparison_score',
    viewIndicateurs: 'view_indicateurs_click',
    viewLabellisation: 'cta_labellisation',
    startEtatLieux: 'cta_edl_commencer',
    personalizeReferentiel: 'cta_edl_personnaliser',
    openSidePanel: 'side_panel_open',
    clickSommaireInfosPanel: 'sommaire_infos_panel_click',
    submitValeursUtiliseesScoreIndicatif:
      'referentiels:valeurs_utilisees_score_indicatif_submit',
    changeViewMode: 'referentiels:change_view_mode',
    changeThematiqueView: 'referentiels:change_thematique_view',
    /** Bascule vers le référentiel TE menée à son terme. */
    switchToTeSuccess: 'referentiels:switch_to_te:success',
  },
  viewGraphZoom: 'zoom_graph',
  downloadGraph: 'export_graph',
  togglePanel: 'panneau_lateral_toggle',
  toggleNavigationLaterale: 'navigation_laterale_toggle',
  showNps: 'show_nps',
} as const;

type DeepValues<T> = {
  [K in keyof T]: T[K] extends Record<string, unknown>
    ? {
        [SubK in keyof T[K]]: T[K][SubK] extends Record<string, unknown>
          ? T[K][SubK][keyof T[K][SubK]]
          : T[K][SubK];
      }[keyof T[K]]
    : T[K];
}[keyof T];

export type EventName = DeepValues<typeof Event>;
