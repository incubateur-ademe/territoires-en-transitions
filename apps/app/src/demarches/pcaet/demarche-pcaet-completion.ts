import { PCAET_REQUIRED_DOCUMENT_SECTION_IDS } from './pcaet-documents.constants';
import type {
  DemarchePcaet,
  DemarchePcaetVoletId,
  DemarchePcaetVoletStatut,
  DemarchePcaetVulnerabiliteState,
} from './demarche-pcaet.types';

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
  description: DemarchePcaetVoletStatut;
  diagnostic: DemarchePcaetVoletStatut;
  plan: DemarchePcaetVoletStatut;
  documents: DemarchePcaetVoletStatut;
  canTransmettre: boolean;
};

export const emptyDemarchePcaetCompletion = (): DemarchePcaetCompletion => ({
  description: 'incomplete',
  diagnostic: 'incomplete',
  plan: 'incomplete',
  documents: 'incomplete',
  canTransmettre: false,
});

const toStatut = (isComplete: boolean): DemarchePcaetVoletStatut =>
  isComplete ? 'complete' : 'incomplete';

export const getDiagnosticVoletStatut = (
  demarche: DemarchePcaet,
  voletId: DemarchePcaetVoletId
): DemarchePcaetVoletStatut =>
  voletId === 'vulnerabilite_territoire'
    ? toStatut(isVulnerabiliteComplete(demarche.vulnerabilite))
    : demarche.volets[voletId];

export const getDemarchePcaetCompletion = (
  demarche: DemarchePcaet
): DemarchePcaetCompletion => {
  const voletIds = Object.keys(demarche.volets) as DemarchePcaetVoletId[];
  const description = toStatut(demarche.description.trim().length > 0);
  const diagnostic = toStatut(
    voletIds.every(
      (voletId) => getDiagnosticVoletStatut(demarche, voletId) === 'complete'
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
