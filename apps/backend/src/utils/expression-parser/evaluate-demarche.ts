/**
 * Ce que le contexte sait de la démarche évaluée. Volontairement séparé de
 * `IdentiteCollectivite` : ce ne sont pas des propriétés de la collectivité mais
 * de son historique de dépôt, et l'identité est partagée avec le calcul de score
 * et le dialecte des indicateurs, qui n'en savent rien.
 */
export type DemarcheExpressionContext = {
  /** Un dépôt antérieur, publié ou archivé, existe pour cette collectivité. */
  renouvellement: boolean;
};

/**
 * Champs interrogeables par `demarche(champ)`.
 *
 * Attention en ajoutant un champ : les mots-clés du DSL sont déclarés avant
 * `CNAME` dans le lexer, sans `longer_alt`. Un nom qui commence par `si`, `min`,
 * `max`, `ou`, `et`, `non`, `vrai`, `faux` ou `oui` serait coupé en deux.
 */
type DemarcheField = keyof DemarcheExpressionContext;

const DEMARCHE_EVALUATORS: Record<
  DemarcheField,
  (contexte: DemarcheExpressionContext) => boolean
> = {
  renouvellement: (contexte) => contexte.renouvellement,
};

function isDemarcheField(value: string): value is DemarcheField {
  // `in` traverse la chaîne de prototypes : `toString` ou `constructor` y
  // passeraient pour des champs valides et rendraient une valeur non booléenne.
  return Object.hasOwn(DEMARCHE_EVALUATORS, value);
}

function buildUnknownFieldErrorMessage(identifier: string): string {
  const allowedFields = Object.keys(DEMARCHE_EVALUATORS).join(', ');
  return (
    `Champ de démarche "${identifier}" non reconnu dans demarche(${identifier}). ` +
    `Champs autorisés : ${allowedFields}.`
  );
}

/**
 * Sans contexte de démarche, la réponse est **faux** plutôt qu'une erreur : le
 * service d'expressions sert aussi la personnalisation des référentiels et les
 * indicateurs, qui ne fournissent pas cette dimension. Même parti que
 * `referentiel(...)`. Un champ inconnu, lui, lève : c'est une coquille, pas une
 * absence de contexte.
 */
export function evaluateDemarche(
  contexte: DemarcheExpressionContext | null,
  identifier: string
): boolean {
  if (!isDemarcheField(identifier)) {
    throw new Error(buildUnknownFieldErrorMessage(identifier));
  }
  if (!contexte) {
    return false;
  }
  return DEMARCHE_EVALUATORS[identifier](contexte);
}
