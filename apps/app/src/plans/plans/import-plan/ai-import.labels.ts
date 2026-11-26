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

type ImportAbandonMotif = NonNullable<
  ImportStatus['report']['abandon']
>['motif'];

/** Ce qui a arrêté l'IA, en une phrase, selon le motif de l'abandon. */
export const importAbandonProblemLabels: Record<ImportAbandonMotif, string> =
  appLabels.importPlanIaAbandonProbleme;

/** Quoi faire après un abandon, selon son motif. */
export const importAbandonAdviceLabels: Record<
  ImportAbandonMotif,
  readonly string[]
> = appLabels.importPlanIaAbandonConseils;

/**
 * Le badge d'un import dans la liste : un abandon motivé n'est pas une
 * panne, il se lit en orange comme son compte rendu.
 */
export const importStatusBadgeOf = ({
  status,
  report,
}: Pick<ImportStatus, 'status' | 'report'>): {
  title: string;
  variant: 'error' | 'success' | 'warning' | 'info';
} => {
  if (status === 'failed' && report.abandon) {
    return { title: appLabels.importPlanIaAbandonCourt, variant: 'warning' };
  }
  return {
    title: importStatusLabels[status],
    variant:
      status === 'failed'
        ? 'error'
        : status === 'done'
        ? 'success'
        : status === 'awaiting_answer'
        ? 'warning'
        : 'info',
  };
};
