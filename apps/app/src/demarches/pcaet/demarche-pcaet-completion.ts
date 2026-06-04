import type {
  DemarchePcaet,
  DemarchePcaetVoletStatut,
} from './demarche-pcaet.types';

export type DemarchePcaetCompletion = {
  description: DemarchePcaetVoletStatut;
  diagnostic: DemarchePcaetVoletStatut;
  plan: DemarchePcaetVoletStatut;
  documents: DemarchePcaetVoletStatut;
  canPublish: boolean;
};

const toStatut = (isComplete: boolean): DemarchePcaetVoletStatut =>
  isComplete ? 'complete' : 'incomplete';

export const getDemarchePcaetCompletion = (
  demarche: DemarchePcaet
): DemarchePcaetCompletion => {
  const description = toStatut(demarche.description.trim().length > 0);
  const diagnostic = toStatut(
    Object.values(demarche.volets).every((statut) => statut === 'complete')
  );
  const plan = toStatut(demarche.planActionId !== null);
  const documents = toStatut(
    demarche.documents.sections.every(
      (section) => section.file !== null || section.couvertSansFichier
    )
  );

  return {
    description,
    diagnostic,
    plan,
    documents,
    canPublish: [description, diagnostic, plan, documents].every(
      (statut) => statut === 'complete'
    ),
  };
};
