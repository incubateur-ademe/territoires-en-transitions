import { describe, expect, it } from 'vitest';
import {
  isResultatEditable,
  pasteFieldForYear,
  valueColumnCountForYears,
  valueFieldsForYear,
} from './cell-editability';
import { toYear } from './types';

describe('cell-editability', () => {
  it('autorise le résultat seulement si year <= now', () => {
    expect(isResultatEditable(toYear(2024), 2026)).toBe(true);
    expect(isResultatEditable(toYear(2026), 2026)).toBe(true);
    expect(isResultatEditable(toYear(2027), 2026)).toBe(false);
  });

  it('cible le champ collage selon now', () => {
    expect(pasteFieldForYear(toYear(2024), 2026)).toBe('resultat');
    expect(pasteFieldForYear(toYear(2027), 2026)).toBe('objectif');
  });

  it('n expose que objectif pour les années futures', () => {
    expect(valueFieldsForYear(toYear(2024), 2026)).toEqual([
      'resultat',
      'objectif',
    ]);
    expect(valueFieldsForYear(toYear(2027), 2026)).toEqual(['objectif']);
    expect(
      valueColumnCountForYears(
        [toYear(2024), toYear(2027), toYear(2030)],
        2026
      )
    ).toBe(4);
  });
});
