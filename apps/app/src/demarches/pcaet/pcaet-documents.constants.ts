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
  linkedFileIds: string[];
  couvertSansFichier: boolean;
};

export type PcaetDocumentsState = {
  files: PcaetDeposedDocumentFile[];
  sections: PcaetDocumentSectionState[];
};

export type PcaetDocumentSectionConfig = {
  id: PcaetDocumentSectionId;
  label: string;
  /** Précision affichée sous le libellé (cas particuliers réglementaires). */
  hint?: string;
  /** Peut être couvert par un autre module TET sans fichier dédié. */
  couvertureAlternative?: 'plan_actions';
};

export const PCAET_DOCUMENT_SECTIONS: PcaetDocumentSectionConfig[] = [
  { id: 'diagnostic', label: 'Diagnostic' },
  { id: 'strategie_territoriale', label: 'Stratégie territoriale' },
  { id: 'plan_actions', label: "Plan d'actions" },
  {
    id: 'dispositif_suivi_evaluation',
    label: "Dispositif de suivi et d'évaluation",
    hint: 'Souvent intégré au plan d’actions plutôt qu’un document séparé.',
    couvertureAlternative: 'plan_actions',
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
  files: [],
  sections: PCAET_DOCUMENT_SECTIONS.map((section) => ({
    sectionId: section.id,
    statut: 'pas_valide',
    linkedFileIds: [],
    couvertSansFichier: false,
  })),
});
