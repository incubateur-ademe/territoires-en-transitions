import { IndicateurValeurCreate } from '@tet/domain/indicateurs';
import { isNil, round } from 'es-toolkit';
import type {
  CalculSourceGroup,
  CalculSourceGroups,
  IndicateurFormula,
} from './calcul-indicateur.types';
import { dehydrateIndicateurPeriod } from './indicateur-period.adapter';
import { DEFAULT_ROUNDING_PRECISION } from './valeurs.constants';

type EvaluateExpression = (
  expression: string,
  values: Record<string, number | null>
) => number | null;

const evaluateField = (
  field: 'resultat' | 'objectif',
  { definition, references }: IndicateurFormula,
  group: CalculSourceGroup,
  evaluate: EvaluateExpression
): number | null => {
  const values: Record<string, number | null> = {};
  for (const valeur of group.valeurs) {
    if (valeur.sourceId === group.sourceId)
      values[valeur.indicateurIdentifiant] = valeur[field];
  }
  // Prefer the direct source, then complete missing fields from allowed extras.
  for (const valeur of group.valeurs) {
    if (isNil(values[valeur.indicateurIdentifiant]) && !isNil(valeur[field])) {
      values[valeur.indicateurIdentifiant] = valeur[field];
    }
  }
  const hasValue = Object.values(values).some((value) => !isNil(value));
  const hasMandatoryValues = references
    .filter(({ optional }) => !optional)
    .every(({ identifiant }) => !isNil(values[identifiant]));
  if (!hasValue || !hasMandatoryValues || !definition.valeurCalcule)
    return null;
  const result = evaluate(definition.valeurCalcule.toLowerCase(), values);
  return result === null
    ? null
    : round(result, definition.precision ?? DEFAULT_ROUNDING_PRECISION);
};

/** Missing observations and present null observations have different meanings. */
export const evaluateCalculIndicateur = (
  formula: IndicateurFormula,
  groups: CalculSourceGroups,
  evaluate: EvaluateExpression
): IndicateurValeurCreate[] => {
  if (!formula.definition.valeurCalcule) return [];
  return Object.values(groups).flatMap((group) => {
    if (group.metadonneeId !== null && group.metadonneeId < 0) return [];
    const present = new Set(
      group.valeurs.map(({ indicateurIdentifiant }) => indicateurIdentifiant)
    );
    const missing = formula.references.filter(
      ({ identifiant }) => !present.has(identifiant)
    );
    if (missing.some(({ optional }) => !optional)) return [];
    // Extra sources may complete an observation, never create one on their own.
    if (!group.valeurs.some((valeur) => valeur.sourceId === group.sourceId))
      return [];
    return [
      {
        collectiviteId: group.collectiviteId,
        indicateurId: formula.definition.id,
        dateValeur: dehydrateIndicateurPeriod(group.period),
        resultat: evaluateField('resultat', formula, group, evaluate),
        objectif: evaluateField('objectif', formula, group, evaluate),
        metadonneeId: group.metadonneeId,
        calculAuto: true,
        calculAutoIdentifiantsManquants: missing.map(
          ({ identifiant }) => identifiant
        ),
      },
    ];
  });
};

export const getCalculatedValeurIdentity = (
  valeur: Pick<
    IndicateurValeurCreate,
    'collectiviteId' | 'indicateurId' | 'dateValeur' | 'metadonneeId'
  >
): string =>
  `${valeur.collectiviteId}:${valeur.indicateurId}:${valeur.dateValeur}:${
    valeur.metadonneeId ?? 'collectivite'
  }`;
