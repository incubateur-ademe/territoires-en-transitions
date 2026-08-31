import {
  CollectivitePopulationTypeEnum,
  CollectiviteSousTypeEnum,
  IdentiteCollectivite,
} from '@tet/domain/collectivites';

type IdentiteField =
  | 'type'
  | 'soustype'
  | 'population'
  | 'localisation'
  | 'dans_aire_urbaine';

/**
 * Le second argument d'`identite(...)` passe par la règle `primary`, qui rend un
 * nombre pour un littéral numérique et un booléen pour `vrai`/`oui` : le typer
 * `string` seul serait un mensonge, et `primary.toLowerCase()` planterait.
 */
type IdentiteEvaluator = (
  identite: IdentiteCollectivite,
  primary: string | number | boolean
) => boolean;

function isIdentiteField(value: string): value is IdentiteField {
  return value in IDENTITE_EVALUATORS;
}

const LEGACY_TYPE_SYNDICAT_VALUE =
  CollectiviteSousTypeEnum.SYNDICAT.toLowerCase();

/**
 * Compatibilité ascendante des référentiels historiques (cae, eci).
 *
 * "syndicat" était à l'origine une valeur du champ `type` (l'enum SQL
 * type_collectivite valait 'EPCI' | 'commune' | 'syndicat'). Le modèle a depuis
 * séparé `type` (EPCI | commune) et `soustype` (epci_a_fiscalite_propre |
 * syndicat | pole), et les expressions nouvellement importées sont normalisées
 * en `identite(soustype, syndicat)`. Mais les règles déjà stockées en base et
 * jamais ré-importées gardent `identite(type, syndicat)`. Sans ce repli du champ
 * `type` vers le `soustype` pour cette valeur legacy, elles s'évalueraient
 * toujours à false pour un syndicat, car `type` ne vaut jamais 'syndicat'.
 */
function matchesLegacyTypeSyndicat(
  identite: IdentiteCollectivite,
  primary: string | number | boolean
): boolean {
  const value = String(primary).toLowerCase();
  return (
    value === LEGACY_TYPE_SYNDICAT_VALUE &&
    identite.soustype?.toLowerCase() === LEGACY_TYPE_SYNDICAT_VALUE
  );
}

const IDENTITE_EVALUATORS: Record<IdentiteField, IdentiteEvaluator> = {
  type: (identite, primary) =>
    identite.type.toLowerCase() === String(primary).toLowerCase() ||
    matchesLegacyTypeSyndicat(identite, primary),
  soustype: (identite, primary) =>
    identite.soustype?.toLowerCase() === String(primary).toLowerCase(),
  population: (identite, primary) =>
    identite.populationTags.includes(primary as CollectivitePopulationTypeEnum),
  localisation: (identite, primary) => identite.drom === (primary === 'DOM'),
  dans_aire_urbaine: (identite, primary) =>
    identite.dansAireUrbaine === (String(primary).toLowerCase() === 'true'),
};

function buildUnknownFieldErrorMessage(
  identifier: string,
  primary: string | number | boolean
): string {
  const allowedFields = Object.keys(IDENTITE_EVALUATORS).join(', ');
  return (
    `Champ d'identité "${identifier}" non reconnu dans identite(${identifier}, ${primary}). ` +
    `Champs autorisés : ${allowedFields}.`
  );
}

export function evaluateIdentite(
  identite: IdentiteCollectivite | null,
  identifier: string,
  primary: string | number | boolean
): boolean {
  if (!identite) {
    throw new Error(
      `Information ${identifier} d'identité de la collectivité non trouvée`
    );
  }

  if (!isIdentiteField(identifier)) {
    throw new Error(buildUnknownFieldErrorMessage(identifier, primary));
  }

  return IDENTITE_EVALUATORS[identifier](identite, primary);
}
