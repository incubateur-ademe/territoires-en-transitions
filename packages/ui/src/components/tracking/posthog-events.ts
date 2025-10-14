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
    viewAvecMdp: 'onglet_avec_mdp',
    viewSansMdp: 'onglet_sans_mdp',
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
    updateAcces: {
      one: 'collectivites_onglet_pa:editer_acces_click',
      multiple: 'collectivites_onglet_pa:editer_acces_groupe_click',
    },
    exportPdf: 'export_PDF',
    exportPdfGroupe: 'export_PDF_telechargement_groupe',
    updateActeurs: 'validation_modale_acteurs_fa',
    updateDescription: 'validation_modale_modifier_fa',
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
  },
  viewGraphZoom: 'zoom_graph',
  downloadGraph: 'export_graph',
  togglePanel: 'panneau_lateral_toggle',
  toggleNavigationLaterale: 'navigation_laterale_toggle',
  accueil: {
    createPlan: 'accueil:PA_creer_plan_click',
    createFiche: 'accueil:PA_creer_fiche_click',
    viewInscriptionDemo: 'PA_demo_inscription_click',
    viewTrajectoiresPagePublique:
      'accueil:trajectoires_page_site_publique_click',
    viewPanierActions: 'accueil:panier_actions_tester_click',
    viewSite: 'accueil:retourner_site_click',
  },
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
