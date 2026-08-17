import {
  hasDemarcheDocumentsForEtape,
  isDemarcheDocumentsAvalComplet,
  isDemarcheDossierDocumentsComplet,
  isDemarchePcaetDiagnosticComplet,
  isDemarchePcaetTopicComplet,
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
  canTransmettre: boolean;
  /** Les pièces aval requises (délibération d'adoption…) sont couvertes. */
  canPublier: boolean;
};

export const emptyDemarchePcaetCompletion = (): DemarchePcaetCompletion => ({
  diagnostic: 'incomplete',
  plan: 'incomplete',
  documents: 'incomplete',
  documentsAval: null,
  canTransmettre: false,
  canPublier: false,
});

const toStatut = (isComplete: boolean): DemarchePcaetTopicStatut =>
  isComplete ? 'complete' : 'incomplete';

/**
 * Badge d'un onglet du diagnostic, tranché par la règle du domaine — la même
 * que celle du guard serveur, quel que soit le type de topic.
 */
export const getDiagnosticTopicStatut = (
  topic: DemarchePcaetTopic
): DemarchePcaetTopicStatut => toStatut(isDemarchePcaetTopicComplet(topic));

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
    canTransmettre: [
      diagnostic,
      plan,
      ...(documents === null ? [] : [documents]),
    ].every((statut) => statut === 'complete'),
    canPublier: documentsSnapshot
      ? isDemarcheDocumentsAvalComplet(documentsSnapshot)
      : false,
  };
};
