import { PCAET_REQUIRED_DOCUMENT_SECTION_IDS } from './pcaet/pcaet-documents.constants';
import type {
  DemarchePcaet,
  DemarchePcaetTopicId,
  DemarchePcaetTopicStatut,
  DemarchePcaetVulnerabiliteState,
} from './types';

export const isVulnerabiliteComplete = (
  state: DemarchePcaetVulnerabiliteState
): boolean =>
  state.lignes.length > 0 &&
  state.lignes.every(
    (ligne) =>
      ligne.diagMaintenant !== 'non_renseigne' &&
      ligne.diag2050 !== 'non_renseigne' &&
      ligne.diag2100 !== 'non_renseigne'
  );

export type DemarchePcaetCompletion = {
  description: DemarchePcaetTopicStatut;
  diagnostic: DemarchePcaetTopicStatut;
  plan: DemarchePcaetTopicStatut;
  documents: DemarchePcaetTopicStatut;
  canTransmettre: boolean;
};

export const emptyDemarchePcaetCompletion = (): DemarchePcaetCompletion => ({
  description: 'incomplete',
  diagnostic: 'incomplete',
  plan: 'incomplete',
  documents: 'incomplete',
  canTransmettre: false,
});

const toStatut = (isComplete: boolean): DemarchePcaetTopicStatut =>
  isComplete ? 'complete' : 'incomplete';

export const getDiagnosticTopicStatut = (
  demarche: DemarchePcaet,
  topicId: DemarchePcaetTopicId
): DemarchePcaetTopicStatut =>
  topicId === 'vulnerabilite_territoire'
    ? toStatut(isVulnerabiliteComplete(demarche.vulnerabilite))
    : demarche.topics[topicId];

export const getDemarchePcaetCompletion = (
  demarche: DemarchePcaet
): DemarchePcaetCompletion => {
  const topicIds = Object.keys(demarche.topics) as DemarchePcaetTopicId[];
  const description = toStatut(demarche.description.trim().length > 0);
  const diagnostic = toStatut(
    topicIds.every(
      (topicId) => getDiagnosticTopicStatut(demarche, topicId) === 'complete'
    )
  );
  const plan = toStatut(demarche.planActionId !== null);
  const documents = toStatut(
    Boolean(demarche.documents.globalDocument) ||
      demarche.documents.sections
        .filter((section) =>
          PCAET_REQUIRED_DOCUMENT_SECTION_IDS.has(section.sectionId)
        )
        .every(
          (section) => section.file !== null || section.couvertSansFichier
        )
  );

  return {
    description,
    diagnostic,
    plan,
    documents,
    // La description rapide est désormais optionnelle et saisie à la création :
    // elle ne conditionne plus la publication du dépôt.
    canTransmettre: [diagnostic, plan, documents].every(
      (statut) => statut === 'complete'
    ),
  };
};
