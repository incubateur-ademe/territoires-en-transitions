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
import type { DemarchePcaet, DemarchePcaetTopicStatut } from './types';

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
 * que celle du guard serveur. `null` pour un volet qui n'exige rien : il n'y a
 * pas d'avancement à annoncer sur ce qui ne peut pas être en retard.
 */
export const getDiagnosticTopicStatut = (
  topic: DemarchePcaetTopic
): DemarchePcaetTopicStatut | null =>
  isDemarchePcaetTopicOptional(topic)
    ? null
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
  const plan = toStatut(demarche.planActionId !== null);
  // Chaque étape documentaire n'existe que si le modèle demande des pièces
  // pour elle ; sans snapshot chargé, l'amont est réputé incomplet (on ne
  // déclare pas complet ce qu'on n'a pas lu) et l'aval inconnu.
  const documents = documentsSnapshot
    ? hasDemarcheDocumentsForEtape(documentsSnapshot.definitions, 'amont')
      ? toStatut(isDemarcheDossierDocumentsComplet(documentsSnapshot))
      : null
    : 'incomplete';
  const documentsAval =
    documentsSnapshot &&
    hasDemarcheDocumentsForEtape(documentsSnapshot.definitions, 'aval')
      ? toStatut(isDemarcheDocumentsAvalComplet(documentsSnapshot))
      : null;

  return {
    diagnostic,
    plan,
    documents,
    documentsAval,
  };
};
