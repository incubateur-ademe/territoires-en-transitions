import {
  hasDemarcheDocumentsForEtape,
  isDemarcheDocumentsAvalComplet,
  isDemarcheDossierDocumentsComplet,
  isDemarchePcaetDiagnosticComplet,
  isPcaetDiagnosticIndicateurComplet,
  type DemarcheDocumentsSnapshot,
  type PcaetDiagnostic,
  type PcaetDiagnosticIndicateurParentConfig,
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
 * Badge d'un onglet indicateur. Un volet `optional` s'annonce optionnel, les
 * autres suivent la saisie (année de référence + horizons, hors optionalYears).
 */
export const getDiagnosticIndicateurTopicStatut = (
  config: PcaetDiagnosticIndicateurParentConfig,
  valeurs: PcaetDiagnostic['indicateurValeurs']
): DemarcheCompletionStatut =>
  config.optional === true
    ? 'optional'
    : toStatut(
        isPcaetDiagnosticIndicateurComplet({ config, indicateurs: valeurs })
      );

/** La vulnérabilité n'exige rien : toujours optionnelle. */
export const getDiagnosticVulnerabiliteTopicStatut =
  (): DemarcheCompletionStatut => 'optional';

/**
 * Avancement du dossier, pour les badges du parcours d'élaboration. Ce qui est
 * *permis* ne se décide pas ici : les transitions sont évaluées par le serveur
 * et lues dans `demarche.transitions`.
 */
export const getDemarchePcaetCompletion = (
  demarche: DemarchePcaet,
  diagnostic: PcaetDiagnostic | null,
  documentsSnapshot?: DemarcheDocumentsSnapshot
): DemarchePcaetCompletion => {
  const diagnosticStatut = toStatut(
    diagnostic !== null && isDemarchePcaetDiagnosticComplet(diagnostic)
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
    diagnostic: diagnosticStatut,
    plan,
    documents,
    documentsAval,
  };
};
