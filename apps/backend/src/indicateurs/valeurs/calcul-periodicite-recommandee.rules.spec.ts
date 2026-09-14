import {
  IndicateurPeriods,
  type IndicateurDefinition,
} from '@tet/domain/indicateurs';
import { describe, expect, it } from 'vitest';
import type {
  CalculSourceValeur,
  IndicateurFormula,
} from './calcul-indicateur.types';
import {
  evaluateCalculIndicateur,
  getCalculatedValeurIdentity,
} from './evaluate-calcul-indicateur.rules';
import { fillCalculSourceGroups } from './group-calcul-indicateur-sources.rules';

const formula: IndicateurFormula = {
  definition: {
    id: 2,
    periodicite: 'annuelle',
    periodiciteMode: 'recommandee',
    valeurCalcule: 'val(source)',
    precision: 2,
  } as IndicateurDefinition,
  references: [{ identifiant: 'source', optional: false, tokens: [] }],
};
const sources = (['annuelle', 'mensuelle'] as const).map(
  (periodicite, index) =>
    ({
      id: index + 1,
      indicateurId: 1,
      indicateurIdentifiant: 'source',
      collectiviteId: 17,
      periodicite,
      dateValeur: '2026-01-01',
      period: IndicateurPeriods.fromDateValeur(periodicite, '2026-01-01'),
      resultat: index === 0 ? 120 : 10,
      objectif: null,
      metadonneeId: null,
      sourceId: null,
      deleted: false,
      metadonneeDateVersion: null,
    } as CalculSourceValeur)
);

describe('recommended formula periodicity', () => {
  it('calculates January and the annual series independently of the recommendation', () => {
    const groups = fillCalculSourceGroups(formula, sources, []);
    const values = evaluateCalculIndicateur(
      formula,
      groups,
      (_, inputs) => inputs.source
    );
    expect(
      values.map(({ periodicite, resultat }) => ({ periodicite, resultat }))
    ).toEqual([
      { periodicite: 'annuelle', resultat: 120 },
      { periodicite: 'mensuelle', resultat: 10 },
    ]);
    expect(new Set(values.map(getCalculatedValeurIdentity)).size).toBe(2);
  });

  it('keeps an imposed annual target annual when a source is also tracked monthly', () => {
    const imposed = {
      ...formula,
      definition: {
        ...formula.definition,
        periodiciteMode: 'imposee' as const,
      },
    };
    const groups = fillCalculSourceGroups(imposed, sources, []);
    const values = evaluateCalculIndicateur(
      imposed,
      groups,
      (_, inputs) => inputs.source
    );
    expect(values).toHaveLength(1);
    expect(values[0]).toMatchObject({ periodicite: 'annuelle', resultat: 120 });
  });
});
