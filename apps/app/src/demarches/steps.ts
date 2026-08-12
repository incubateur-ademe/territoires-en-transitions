import {
  makeCollectiviteDemarchePcaetDiagnosticUrl,
  makeCollectiviteDemarchePcaetDocumentsUrl,
  makeCollectiviteDemarchePcaetPlanActionsUrl,
} from '@/app/app/paths';
import { resolveActiveTopic } from './active-topic';

export const DEMARCHE_SECTION_KEYS = [
  'documents',
  'diagnostic',
  'plan',
] as const;

export type DemarcheSectionKey = (typeof DEMARCHE_SECTION_KEYS)[number];

/**
 * Un item du parcours aplati de l'élaboration. `topicCode` n'existe que pour
 * le diagnostic ; il vaut `null` tant que la liste des topics n'est pas chargée.
 */
export type DemarcheStepItem = {
  section: DemarcheSectionKey;
  topicCode: string | null;
};

/**
 * Déroule le parcours de l'élaboration : documents (si le modèle demande des
 * pièces amont), puis un item par topic du diagnostic, puis le plan.
 */
export const flattenSteps = ({
  hasDocuments,
  topicCodes,
}: {
  hasDocuments: boolean;
  topicCodes: readonly string[];
}): DemarcheStepItem[] => [
  ...(hasDocuments
    ? [{ section: 'documents' as const, topicCode: null }]
    : []),
  ...(topicCodes.length > 0
    ? topicCodes.map((topicCode) => ({
        section: 'diagnostic' as const,
        topicCode,
      }))
    : [{ section: 'diagnostic' as const, topicCode: null }]),
  { section: 'plan' as const, topicCode: null },
];

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

export type StepsNavModel = {
  prev: DemarcheStepItem | null;
  next: DemarcheStepItem | null;
  /** Sur le dernier item, « suivant » devient l'action de transmission. */
  isLastStep: boolean;
};

/**
 * Résout la position courante puis calcule les items adjacents.
 */
export const getStepsNavModel = ({
  activeSection,
  hasDocuments,
  topicCodes,
  currentTopicCode,
}: {
  activeSection: DemarcheSectionKey;
  hasDocuments: boolean;
  topicCodes: readonly string[];
  currentTopicCode: string | null;
}): StepsNavModel => {
  const items = flattenSteps({ hasDocuments, topicCodes });
  const resolvedTopicCode =
    activeSection !== 'diagnostic'
      ? null
      : resolveActiveTopic(topicCodes, currentTopicCode, (code) => code);
  const index = items.findIndex(
    (item) =>
      item.section === activeSection && item.topicCode === resolvedTopicCode
  );

  return {
    prev: (index > 0 && items[index - 1]) || null,
    next: (index >= 0 && items[index + 1]) || null,
    isLastStep: index >= 0 && index === items.length - 1,
  };
};
