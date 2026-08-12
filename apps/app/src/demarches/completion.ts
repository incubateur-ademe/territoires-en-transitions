import {
  DemarchePcaetTopicKindEnum,
  isDemarcheDossierDocumentsComplet,
  isDemarchePcaetDiagnosticComplet,
  isDemarchePcaetTopicComplet,
  type DemarcheDocumentsSnapshot,
  type DemarchePcaetTopic,
} from '@tet/domain/demarches';
import type {
  DemarchePcaet,
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

/**
 * Badge d'un onglet du diagnostic. La vulnérabilité du territoire vit encore en
 * sessionStorage : son badge est dérivé localement, à titre indicatif — elle ne
 * conditionne pas la transmission, sans quoi le front et le serveur ne
 * porteraient plus le même verdict.
 */
export const getDiagnosticTopicStatut = (
  demarche: DemarchePcaet,
  topic: DemarchePcaetTopic
): DemarchePcaetTopicStatut =>
  topic.kind === DemarchePcaetTopicKindEnum.VULNERABILITE
    ? toStatut(isVulnerabiliteComplete(demarche.vulnerabilite))
    : toStatut(isDemarchePcaetTopicComplet(topic));

/**
 * Avancement du dossier. Diagnostic et documents sont tranchés par les règles du
 * domaine, appliquées aux mêmes objets que les guards serveur : le bouton de
 * transmission et l'API ne peuvent pas se contredire.
 */
export const getDemarchePcaetCompletion = (
  demarche: DemarchePcaet,
  topics: readonly DemarchePcaetTopic[],
  documentsSnapshot?: DemarcheDocumentsSnapshot
): DemarchePcaetCompletion => {
  const description = toStatut(demarche.description.trim().length > 0);
  const diagnostic = toStatut(
    isDemarchePcaetDiagnosticComplet({ topics: [...topics] })
  );
  const plan = toStatut(demarche.planActionId !== null);
  // Sans snapshot chargé, le dossier documentaire est réputé incomplet : on ne
  // déclare pas complet ce qu'on n'a pas lu.
  const documents = toStatut(
    documentsSnapshot
      ? isDemarcheDossierDocumentsComplet(documentsSnapshot)
      : false
  );

  return {
    description,
    diagnostic,
    plan,
    documents,
    // La description rapide est optionnelle et saisie à la création : elle ne
    // conditionne plus le dépôt.
    canTransmettre: [diagnostic, plan, documents].every(
      (statut) => statut === 'complete'
    ),
  };
};
