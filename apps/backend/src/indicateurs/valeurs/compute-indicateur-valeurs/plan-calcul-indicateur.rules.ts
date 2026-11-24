import {
  IndicateurPeriodes,
  IndicateurValeurCreate,
} from '@tet/domain/indicateurs';
import { isNil, round } from 'es-toolkit';
import type {
  CalculSourceGroup,
  CalculSourceGroups,
  IndicateurFormula,
} from './calcul-indicateur.types';
import { DEFAULT_ROUNDING_PRECISION } from '../valeurs.constants';

export type CalculEvaluation = {
  expression: string;
  values: Record<string, number | null>;
  precision: number;
};

export type PlannedCalculValeur = {
  valeur: Omit<IndicateurValeurCreate, 'resultat' | 'objectif'>;
  resultat: CalculEvaluation | null;
  objectif: CalculEvaluation | null;
};

const planField = (
  field: 'resultat' | 'objectif',
  { definition: indicateur, references }: IndicateurFormula,
  group: CalculSourceGroup
): CalculEvaluation | null => {
  if (
    group.requiresDirectValueForField &&
    !group.valeurs.some(
      (valeur) => valeur.sourceId === group.sourceId && !isNil(valeur[field])
    )
  )
    return null;
  const values: Record<string, number | null> = {};
  for (const valeur of group.valeurs) {
    if (valeur.sourceId === group.sourceId)
      values[valeur.indicateurIdentifiant] = valeur[field];
  }
  for (const valeur of group.valeurs) {
    if (isNil(values[valeur.indicateurIdentifiant]) && !isNil(valeur[field])) {
      values[valeur.indicateurIdentifiant] = valeur[field];
    }
  }
  const hasValue = Object.values(values).some((value) => !isNil(value));
  const hasMandatoryValues = references
    .filter(({ optional }) => !optional)
    .every(({ identifiant }) => !isNil(values[identifiant]));
  if (!hasValue || !hasMandatoryValues || !indicateur.valeurCalcule)
    return null;
  return {
    expression: indicateur.valeurCalcule.toLowerCase(),
    values,
    precision: indicateur.precision ?? DEFAULT_ROUNDING_PRECISION,
  };
};

export const roundCalculResult = (
  result: number | null,
  precision: number
): number | null => (result === null ? null : round(result, precision));

/** Missing observations and present null observations have different meanings. */
export const planCalculIndicateur = (
  formula: IndicateurFormula,
  groups: CalculSourceGroups
): PlannedCalculValeur[] => {
  if (!formula.definition.valeurCalcule) return [];
  return Object.values(groups).flatMap((group) => {
    if (group.periode.periodicite !== formula.definition.periodicite) return [];
    if (group.metadonneeId !== null && group.metadonneeId < 0) return [];
    const present = new Set(
      group.valeurs.map(({ indicateurIdentifiant }) => indicateurIdentifiant)
    );
    const missing = formula.references.filter(
      ({ identifiant }) => !present.has(identifiant)
    );
    if (missing.some(({ optional }) => !optional)) return [];
    if (!group.valeurs.some((valeur) => valeur.sourceId === group.sourceId))
      return [];
    return [
      {
        valeur: {
          collectiviteId: group.collectiviteId,
          indicateurId: formula.definition.id,
          dateValeur: IndicateurPeriodes.toDateValeur(group.periode),
          periodicite: group.periode.periodicite,
          metadonneeId: group.metadonneeId,
          calculAuto: true,
          calculAutoIdentifiantsManquants: missing.map(
            ({ identifiant }) => identifiant
          ),
        },
        resultat: planField('resultat', formula, group),
        objectif: planField('objectif', formula, group),
      },
    ];
  });
};
