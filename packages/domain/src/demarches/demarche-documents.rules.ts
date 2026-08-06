import type {
  DemarcheDocumentDefinition,
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
    if (couvertures.has(definition.id)) {
      return {
        documentId: definition.id,
        couvert: true,
        origine: 'plan_actions',
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

/** Les pièces dont la couverture conditionne la complétude du dossier. */
const isRequiredSection = (definition: DemarcheDocumentDefinition): boolean =>
  definition.requis && definition.portee === 'section';

/**
 * Le topic « Documents » du dossier est-il complet ? Toutes les pièces requises
 * du détail par section doivent être couvertes, d'une manière ou d'une autre.
 */
export const isDemarcheDossierDocumentsComplet = (
  snapshot: DemarcheDocumentsSnapshot
): boolean => {
  const requiredIds = new Set(
    snapshot.definitions.filter(isRequiredSection).map(({ id }) => id)
  );
  if (requiredIds.size === 0) {
    return false;
  }
  return computeDemarcheDocumentsCoverage(snapshot)
    .filter(({ documentId }) => requiredIds.has(documentId))
    .every(({ couvert }) => couvert);
};
