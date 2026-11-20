import { appLabels } from '@/app/labels/catalog';
import type { RouterOutput } from '@tet/api';
import type { ImportStepView } from './ai-import-steps.model';

type ImportStatus = RouterOutput['plans']['aiImport']['getAiImportStatus'];

/** Libellés courts du statut d'un import, pour la liste et les badges. */
export const importStatusLabels: Record<ImportStatus['status'], string> = {
  pending: appLabels.importPlanIaEnAttente,
  running: appLabels.importPlanIaEnCoursCourt,
  done: appLabels.importPlanIaTermine,
  failed: appLabels.importPlanIaEchecCourt,
  awaiting_answer: appLabels.importPlanIaEnAttenteReponse,
};

export const importStepStatusLabels: Record<ImportStepView['status'], string> =
  {
    done: appLabels.importPlanIaEtapeTerminee,
    current: appLabels.importPlanIaEtapeEnCours,
    waiting: appLabels.importPlanIaEtapeEnAttente,
    failed: appLabels.importPlanIaEtapeEnEchec,
    skipped: appLabels.importPlanIaEtapeIgnoree,
  };

export const importReportStepLabels = {
  reading: appLabels.importPlanIaEtapeLecture,
  extraction: appLabels.importPlanIaRapportEtapeExtraction,
} satisfies Partial<Record<ImportStepView['name'], string>>;

/** Libellés des remarques du compte rendu, par nature de remarque. */
export const importIssueLabels = {
  'document-error': appLabels.importPlanIaDocumentErreur,
  'configuration-error': appLabels.importPlanIaConfigurationErreur,
  'processing-error': appLabels.importPlanIaDocumentErreur,
  warning: appLabels.importPlanIaAvertissementRapport,
  'preserved-data': appLabels.importPlanIaDonneesConservees,
} satisfies Record<ImportStatus['report']['issues'][number]['kind'], string>;

export const importIssueHintLabels = {
  'document-error': appLabels.importPlanIaDocumentErreurHint,
  'configuration-error': appLabels.importPlanIaConfigurationErreurHint,
  'processing-error': appLabels.importPlanIaErreurTechniqueHint,
  warning: undefined,
  'preserved-data': undefined,
} satisfies Record<
  ImportStatus['report']['issues'][number]['kind'],
  string | undefined
>;
