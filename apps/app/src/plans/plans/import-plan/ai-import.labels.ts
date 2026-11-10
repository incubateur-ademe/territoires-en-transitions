import { appLabels } from '@/app/labels/catalog';
import type { RouterOutput } from '@tet/api';

type ImportStatus = RouterOutput['plans']['aiImport']['getAiImportStatus'];

/** Libellés courts du statut d'un import, pour la liste et les badges. */
export const importStatusLabels: Record<ImportStatus['status'], string> = {
  pending: appLabels.importPlanIaEnAttente,
  running: appLabels.importPlanIaEnCoursCourt,
  done: appLabels.importPlanIaTermine,
  failed: appLabels.importPlanIaEchecCourt,
};

/** Libellés des remarques du compte rendu, par nature de remarque. */
export const importIssueLabels = {
  'document-error': appLabels.importPlanIaDocumentErreur,
  'configuration-error': appLabels.importPlanIaConfigurationErreur,
  'processing-error': appLabels.importPlanIaErreur,
  warning: appLabels.importPlanIaAvertissementRapport,
  'preserved-data': appLabels.importPlanIaDonneesConservees,
} satisfies Record<ImportStatus['report']['issues'][number]['kind'], string>;
