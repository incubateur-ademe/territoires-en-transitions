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
};

export const PCAET_DOCUMENT_SECTIONS: PcaetDocumentSectionConfig[] = [
  { id: 'diagnostic', label: 'Diagnostic' },
  { id: 'strategie_territoriale', label: 'Stratégie territoriale' },
  { id: 'plan_actions', label: "Plan d'actions" },
  {
    id: 'dispositif_suivi_evaluation',
    label: "Dispositif de suivi et d'évaluation",
  },
  {
    id: 'ees',
    label: 'EES (évaluation environnementale stratégique)',
  },
  {
    id: 'deliberation_adoption',
    label: 'Délibération d’adoption du PCAET',
  },
  {
    id: 'memoire_reponse_avis',
    label: 'Mémoire de réponse aux avis institutionnels',
  },
  {
    id: 'synthese_consultation_publique',
    label: 'Synthèse des contributions et réponses à la consultation publique',
  },
  {
    id: 'bilan_pcaet_precedent',
    label: 'Bilan du PCAET précédent',
  },
];

export const defaultPcaetDocumentsState = (): PcaetDocumentsState => ({
  globalDocument: null,
  sections: PCAET_DOCUMENT_SECTIONS.map((section) => ({
    sectionId: section.id,
    statut: 'pas_valide',
    file: null,
    couvertSansFichier: false,
  })),
});
