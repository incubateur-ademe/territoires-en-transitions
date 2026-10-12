import {
  IndicateurPeriodiciteEnum,
  IndicateurPeriods,
} from '@tet/domain/indicateurs';
import { describe, expect, it } from 'vitest';
import { isResultatEditable, valueFieldsForPeriod } from './cell-editability';

const period = (year: number) =>
  IndicateurPeriods.parse(IndicateurPeriodiciteEnum.ANNUELLE, String(year));

describe('cell-editability', () => {
  it('autorise le résultat pour une période passée ou courante', () => {
    expect(isResultatEditable(period(2024), period(2026))).toBe(true);
    expect(isResultatEditable(period(2026), period(2026))).toBe(true);
    expect(isResultatEditable(period(2027), period(2026))).toBe(false);
  });

  it('n expose que resultat pour les années passées ou courantes', () => {
    expect(valueFieldsForPeriod(period(2024), period(2026))).toEqual([
      'resultat',
    ]);
    expect(valueFieldsForPeriod(period(2026), period(2026))).toEqual([
      'resultat',
    ]);
  });

  it('n expose que objectif pour les années futures', () => {
    expect(valueFieldsForPeriod(period(2027), period(2026))).toEqual([
      'objectif',
    ]);
  });
});
