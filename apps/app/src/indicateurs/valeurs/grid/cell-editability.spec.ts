import {
  IndicateurPeriodiciteEnum,
  IndicateurPeriodes,
} from '@tet/domain/indicateurs';
import { describe, expect, it } from 'vitest';
import { isResultatEditable, valueFieldsForPeriode } from './cell-editability';

const periode = (year: number) =>
  IndicateurPeriodes.parse(IndicateurPeriodiciteEnum.ANNUELLE, String(year));

describe('cell-editability', () => {
  it('autorise le résultat pour une période passée ou courante', () => {
    expect(isResultatEditable(periode(2024), periode(2026))).toBe(true);
    expect(isResultatEditable(periode(2026), periode(2026))).toBe(true);
    expect(isResultatEditable(periode(2027), periode(2026))).toBe(false);
  });

  it('n expose que resultat pour les années passées ou courantes', () => {
    expect(valueFieldsForPeriode(periode(2024), periode(2026))).toEqual([
      'resultat',
    ]);
    expect(valueFieldsForPeriode(periode(2026), periode(2026))).toEqual([
      'resultat',
    ]);
  });

  it('n expose que objectif pour les années futures', () => {
    expect(valueFieldsForPeriode(periode(2027), periode(2026))).toEqual([
      'objectif',
    ]);
  });
});
