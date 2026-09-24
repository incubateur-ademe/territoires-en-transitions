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
    aggregationResultat: null,
    aggregationObjectif: null,
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

describe('formula declaration periodicity', () => {
  it.each(['annuelle', 'mensuelle'] as const)(
    'calculates only the %s series fixed by the target definition',
    (periodicite) => {
      const target = {
        ...formula,
        definition: { ...formula.definition, periodicite },
      };
      const groups = fillCalculSourceGroups(target, sources, []);
      const values = evaluateCalculIndicateur(
        target,
        groups,
        (_, inputs) => inputs.source
      );
      expect(values).toHaveLength(1);
      expect(values[0]).toMatchObject({
        periodicite,
        resultat: periodicite === 'annuelle' ? 120 : 10,
      });
      expect(new Set(values.map(getCalculatedValeurIdentity)).size).toBe(1);
    }
  );
});
