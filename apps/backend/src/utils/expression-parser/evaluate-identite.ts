import {
  CollectivitePopulationTypeEnum,
  IdentiteCollectivite,
} from '@tet/domain/collectivites';

type IdentiteField =
  | 'type'
  | 'soustype'
  | 'population'
  | 'localisation'
  | 'dans_aire_urbaine';

type IdentiteEvaluator = (
  identite: IdentiteCollectivite,
  primary: string
) => boolean;

function isIdentiteField(value: string): value is IdentiteField {
  return value in IDENTITE_EVALUATORS;
}

const IDENTITE_EVALUATORS: Record<IdentiteField, IdentiteEvaluator> = {
  type: (identite, primary) =>
    identite.type.toLowerCase() === primary.toLowerCase(),
  soustype: (identite, primary) =>
    identite.soustype?.toLowerCase() === primary.toLowerCase(),
  population: (identite, primary) =>
    identite.populationTags.includes(primary as CollectivitePopulationTypeEnum),
  localisation: (identite, primary) => identite.drom === (primary === 'DOM'),
  dans_aire_urbaine: (identite, primary) =>
    identite.dansAireUrbaine === (String(primary).toLowerCase() === 'true'),
};

function buildUnknownFieldErrorMessage(
  identifier: string,
  primary: string
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
  primary: string
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
