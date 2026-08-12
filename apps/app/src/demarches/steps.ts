import {
  makeCollectiviteDemarchePcaetDiagnosticUrl,
  makeCollectiviteDemarchePcaetDocumentsUrl,
  makeCollectiviteDemarchePcaetPlanActionsUrl,
} from '@/app/app/paths';

export const DEMARCHE_SECTION_KEYS = [
  'documents',
  'diagnostic',
  'plan',
] as const;

export type DemarcheSectionKey = (typeof DEMARCHE_SECTION_KEYS)[number];

export const makeDemarcheSectionUrl = (
  section: DemarcheSectionKey,
  ids: { collectiviteId: number; demarcheId: number }
): string => {
  switch (section) {
    case 'documents':
      return makeCollectiviteDemarchePcaetDocumentsUrl(ids);
    case 'diagnostic':
      return makeCollectiviteDemarchePcaetDiagnosticUrl(ids);
    case 'plan':
      return makeCollectiviteDemarchePcaetPlanActionsUrl(ids);
  }
};
