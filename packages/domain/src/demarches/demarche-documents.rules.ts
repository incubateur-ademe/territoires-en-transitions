import type {
  DemarcheDocumentDefinition,
  DemarcheDocumentEtape,
  DemarcheDocumentsSnapshot,
} from './demarche-document.schema';

/**
 * Comment une pièce attendue est couverte. `fichier` = dépôt spécifique,
 * `plan_actions` = déclaration de prise en charge par la plateforme,
 * `substitut` = couverte par le dépôt d'une autre pièce (le document global).
 */
export type DemarcheDocumentCoverageOrigine =
  | 'fichier'
  | 'plan_actions'
  | 'substitut';

export type DemarcheDocumentCoverage = {
  documentId: string;
  couvert: boolean;
  origine: DemarcheDocumentCoverageOrigine | null;
  /** Renseigné quand `origine === 'substitut'` : la pièce qui couvre celle-ci. */
  substitutId: string | null;
};

/**
 * Calcule la couverture de chaque pièce attendue.
 *
 * Un dépôt spécifique prime toujours ; vient ensuite la couverture déclarée par
 * la plateforme, puis la substitution (document global). La règle « le document
 * global fait passer toutes les sections au vert » n'est pas codée ici : elle
 * découle des substitutions déclarées par le catalogue du type de démarche.
 */
export const computeDemarcheDocumentsCoverage = (
  snapshot: DemarcheDocumentsSnapshot
): DemarcheDocumentCoverage[] => {
  // Une pièce satisfaite sans fichier est déclarée prise en charge par la
  // fonctionnalité de sa définition (couverturePlateforme).
  const deposes = new Set(
    snapshot.documents
      .filter(({ fichier }) => fichier !== null)
      .map(({ documentId }) => documentId)
  );
  const couvertures = new Set(
    snapshot.documents
      .filter(({ fichier }) => fichier === null)
      .map(({ documentId }) => documentId)
  );

  return snapshot.definitions.map((definition) => {
    if (deposes.has(definition.id)) {
      return {
        documentId: definition.id,
        couvert: true,
        origine: 'fichier',
        substitutId: null,
      };
    }
    // La couverture déclarée n'est recevable que si le modèle la prévoit pour
    // cette pièce : une ligne sans fichier sur une pièce sans couverture
    // plateforme ne couvre rien, quelle que soit la manière dont elle est arrivée
    // en base.
    if (couvertures.has(definition.id) && definition.couverturePlateforme) {
      return {
        documentId: definition.id,
        couvert: true,
        origine: definition.couverturePlateforme,
        substitutId: null,
      };
    }
    const substitutId = definition.substituts.find((id) => deposes.has(id));
    if (substitutId) {
      return {
        documentId: definition.id,
        couvert: true,
        origine: 'substitut',
        substitutId,
      };
    }
    return {
      documentId: definition.id,
      couvert: false,
      origine: null,
      substitutId: null,
    };
  });
};

/** Les pièces dont la couverture conditionne la complétude d'une étape. */
const isRequiredSection =
  (etape: DemarcheDocumentEtape) =>
  (definition: DemarcheDocumentDefinition): boolean =>
    definition.requis &&
    definition.portee === 'section' &&
    definition.etape === etape;

const areRequiredSectionsCovered = (
  snapshot: DemarcheDocumentsSnapshot,
  requiredIds: ReadonlySet<string>
): boolean =>
  computeDemarcheDocumentsCoverage(snapshot)
    .filter(({ documentId }) => requiredIds.has(documentId))
    .every(({ couvert }) => couvert);

/**
 * Le topic « Documents » du dossier d'élaboration est-il complet ? Toutes les
 * pièces amont requises du détail par section doivent être couvertes, d'une
 * manière ou d'une autre. Les pièces aval (délibération d'adoption…) ne pèsent
 * pas sur la transmission : elles conditionnent la publication.
 */
export const isDemarcheDossierDocumentsComplet = (
  snapshot: DemarcheDocumentsSnapshot
): boolean => {
  const requiredIds = new Set(
    snapshot.definitions.filter(isRequiredSection('amont')).map(({ id }) => id)
  );
  if (requiredIds.size === 0) {
    return false;
  }
  return areRequiredSectionsCovered(snapshot, requiredIds);
};

/**
 * Les pièces aval requises sont-elles couvertes ? Contrairement à l'amont, un
 * modèle sans pièce aval requise est complet : rien n'est exigé pour publier.
 */
export const isDemarcheDocumentsAvalComplet = (
  snapshot: DemarcheDocumentsSnapshot
): boolean => {
  const requiredIds = new Set(
    snapshot.definitions.filter(isRequiredSection('aval')).map(({ id }) => id)
  );
  return areRequiredSectionsCovered(snapshot, requiredIds);
};

/**
 * Le modèle demande-t-il des pièces pour cette étape ? Pilote l'affichage de la
 * sous-étape « Ajouter les documents attendus » du stepper.
 */
export const hasDemarcheDocumentsForEtape = (
  definitions: readonly DemarcheDocumentDefinition[],
  etape: DemarcheDocumentEtape
): boolean =>
  definitions.some(
    (definition) => definition.portee === 'section' && definition.etape === etape
  );
