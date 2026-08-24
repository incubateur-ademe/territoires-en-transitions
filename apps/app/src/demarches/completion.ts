import {
  hasDemarcheDocumentsForEtape,
  isDemarcheDocumentsAvalComplet,
  isDemarcheDossierDocumentsComplet,
  isDemarchePcaetDiagnosticComplet,
  isDemarchePcaetTopicComplet,
  isDemarchePcaetTopicOptional,
  type DemarcheDocumentsSnapshot,
  type DemarchePcaetTopic,
} from '@tet/domain/demarches';
import type {
  DemarcheCompletionStatut,
  DemarchePcaet,
  DemarchePcaetTopicStatut,
} from './types';

export type DemarchePcaetCompletion = {
  diagnostic: DemarchePcaetTopicStatut;
  plan: DemarchePcaetTopicStatut;
  /** `null` : le modèle ne demande aucune pièce amont, la sous-étape est masquée. */
  documents: DemarchePcaetTopicStatut | null;
  /** `null` : aucune pièce aval demandée (ou dossier non chargé), sous-étape masquée. */
  documentsAval: DemarchePcaetTopicStatut | null;
};

export const emptyDemarchePcaetCompletion = (): DemarchePcaetCompletion => ({
  diagnostic: 'incomplete',
  plan: 'incomplete',
  documents: 'incomplete',
  documentsAval: null,
});

const toStatut = (isComplete: boolean): DemarchePcaetTopicStatut =>
  isComplete ? 'complete' : 'incomplete';

/**
 * Badge d'un onglet du diagnostic, tranché par la règle du domaine — la même
 * que celle du guard serveur. Un volet qui n'exige rien s'annonce optionnel :
 * il n'y a pas d'avancement à afficher sur ce qui ne peut pas être en retard.
 */
export const getDiagnosticTopicStatut = (
  topic: DemarchePcaetTopic
): DemarcheCompletionStatut =>
  isDemarchePcaetTopicOptional(topic)
    ? 'optional'
    : toStatut(isDemarchePcaetTopicComplet(topic));

/**
 * Avancement du dossier, pour les badges du parcours d'élaboration. Ce qui est
 * *permis* ne se décide pas ici : les transitions sont évaluées par le serveur
 * et lues dans `demarche.transitions`.
 */
export const getDemarchePcaetCompletion = (
  demarche: DemarchePcaet,
  topics: readonly DemarchePcaetTopic[],
  documentsSnapshot?: DemarcheDocumentsSnapshot
): DemarchePcaetCompletion => {
  const diagnostic = toStatut(
    isDemarchePcaetDiagnosticComplet({ topics: [...topics] })
  );
  const plan = toStatut(demarche.planActionIds.length > 0);
  // Chaque étape documentaire n'existe que si le modèle demande des pièces
  // pour elle ; sans snapshot chargé, l'amont est réputé incomplet (on ne
  // déclare pas complet ce qu'on n'a pas lu) et l'aval inconnu.
  const documents = documentsSnapshot
    ? hasDemarcheDocumentsForEtape(documentsSnapshot, 'amont')
      ? toStatut(isDemarcheDossierDocumentsComplet(documentsSnapshot))
      : null
    : 'incomplete';
  const documentsAval =
    documentsSnapshot && hasDemarcheDocumentsForEtape(documentsSnapshot, 'aval')
      ? toStatut(isDemarcheDocumentsAvalComplet(documentsSnapshot))
      : null;

  return {
    diagnostic,
    plan,
    documents,
    documentsAval,
  };
};
