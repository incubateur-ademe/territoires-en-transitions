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
 * Le temps du dossier que le parcours déroule. Même découpage que celui des
 * pièces et des règles de modification : avant les avis, après les avis.
 */
export type DemarcheParcoursEtape = 'amont' | 'aval';

/**
 * Déroule le parcours d'un temps du dossier : les documents (si le modèle en
 * attend à ce temps-là), le diagnostic, puis le plan.
 *
 * L'amont éclate le diagnostic en un item par topic : c'est là qu'on le
 * remplit, volet par volet. L'aval le garde entier — ce n'est plus qu'un rappel,
 * ses onglets restent à portée de main, et l'éclater mettrait la validation
 * finale six clics plus loin.
 */
export const flattenSteps = ({
  etape,
  hasDocuments,
  topicCodes,
}: {
  etape: DemarcheParcoursEtape;
  hasDocuments: boolean;
  topicCodes: readonly string[];
}): DemarcheStepItem[] => [
  ...(hasDocuments ? [{ section: 'documents' as const, topicCode: null }] : []),
  ...(etape === 'amont' && topicCodes.length > 0
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
  /** Sur le dernier item, « suivant » devient l'action qui clôt le temps. */
  isLastStep: boolean;
};

/**
 * Résout la position courante puis calcule les items adjacents.
 */
export const getStepsNavModel = ({
  etape,
  activeSection,
  hasDocuments,
  topicCodes,
  currentTopicCode,
}: {
  etape: DemarcheParcoursEtape;
  activeSection: DemarcheSectionKey;
  hasDocuments: boolean;
  topicCodes: readonly string[];
  currentTopicCode: string | null;
}): StepsNavModel => {
  const items = flattenSteps({ etape, hasDocuments, topicCodes });
  // Le topic ne situe la position que là où le parcours en fait des items :
  // à l'aval, le diagnostic est un item unique, quel que soit l'onglet ouvert.
  const resolvedTopicCode =
    etape === 'aval' || activeSection !== 'diagnostic'
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
