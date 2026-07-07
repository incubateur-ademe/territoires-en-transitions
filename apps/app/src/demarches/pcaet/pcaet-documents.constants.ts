export type PcaetDocumentSectionId =
  | 'diagnostic'
  | 'strategie_territoriale'
  | 'plan_actions'
  | 'dispositif_suivi_evaluation'
  | 'ees'
  | 'deliberation_adoption'
  | 'memoire_reponse_avis'
  | 'synthese_consultation_publique'
  | 'bilan_pcaet_precedent';

export type PcaetDocumentValidationStatus = 'valide' | 'pas_valide';

export type PcaetDeposedDocumentFile = {
  id: string;
  name: string;
};

export type PcaetDocumentSectionState = {
  sectionId: PcaetDocumentSectionId;
  statut: PcaetDocumentValidationStatus;
  file: PcaetDeposedDocumentFile | null;
  couvertSansFichier: boolean;
};

export type PcaetDocumentsState = {
  /**
   * Document global regroupant l’ensemble des pièces attendues. Lorsqu’il est
   * présent, toutes les sections sont considérées comme couvertes (sauf dépôt
   * spécifique par section).
   */
  globalDocument: PcaetDeposedDocumentFile | null;
  sections: PcaetDocumentSectionState[];
};

export type PcaetDocumentSectionConfig = {
  id: PcaetDocumentSectionId;
  label: string;
  /**
   * Une section obligatoire doit être couverte (fichier spécifique, document
   * global ou couverture via le plan d’actions) pour que l’étape « Documents »
   * soit considérée comme terminée.
   */
  required: boolean;
  /**
   * Lorsque `true`, la section peut être marquée comme couverte par le plan
   * d’actions suivi dans la plateforme (via une case à cocher), sans qu’un
   * document dédié ne soit déposé.
   */
  couvrableParPlanActions?: boolean;
};

export const PCAET_DOCUMENT_SECTIONS: PcaetDocumentSectionConfig[] = [
  { id: 'diagnostic', label: 'Diagnostic', required: true },
  {
    id: 'strategie_territoriale',
    label: 'Stratégie territoriale',
    required: true,
  },
  { id: 'plan_actions', label: "Plan d'actions", required: true },
  {
    id: 'dispositif_suivi_evaluation',
    label: "Dispositif de suivi et d'évaluation",
    required: true,
    couvrableParPlanActions: true,
  },
  {
    id: 'ees',
    label: 'EES (évaluation environnementale stratégique)',
    required: false,
  },
  {
    id: 'deliberation_adoption',
    label: 'Délibération d’adoption du PCAET',
    required: false,
  },
  {
    id: 'memoire_reponse_avis',
    label: 'Mémoire de réponse aux avis institutionnels',
    required: false,
  },
  {
    id: 'synthese_consultation_publique',
    label: 'Synthèse des contributions et réponses à la consultation publique',
    required: false,
  },
  {
    id: 'bilan_pcaet_precedent',
    label: 'Bilan du PCAET précédent',
    required: false,
  },
];

/** Identifiants des sections de documents obligatoires. */
export const PCAET_REQUIRED_DOCUMENT_SECTION_IDS: ReadonlySet<PcaetDocumentSectionId> =
  new Set(
    PCAET_DOCUMENT_SECTIONS.filter((section) => section.required).map(
      (section) => section.id
    )
  );

export const defaultPcaetDocumentsState = (): PcaetDocumentsState => ({
  globalDocument: null,
  sections: PCAET_DOCUMENT_SECTIONS.map((section) => ({
    sectionId: section.id,
    statut: 'pas_valide',
    file: null,
    couvertSansFichier: false,
  })),
});
