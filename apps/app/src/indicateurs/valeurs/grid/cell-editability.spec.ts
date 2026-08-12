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

  it('n expose que resultat sur l année de référence', () => {
    expect(valueFieldsForYear(toYear(2018), 2026, toYear(2018))).toEqual([
      'resultat',
    ]);
  });

  it('laisse ses deux champs à une autre année écoulée', () => {
    expect(valueFieldsForYear(toYear(2021), 2026, toYear(2018))).toEqual([
      'resultat',
      'objectif',
    ]);
  });

  it('laisse ses deux champs à un horizon déjà écoulé', () => {
    expect(valueFieldsForYear(toYear(2025), 2026, toYear(2018))).toEqual([
      'resultat',
      'objectif',
    ]);
  });

  it('compte les colonnes en tenant l année de référence pour une seule', () => {
    expect(
      valueColumnCountForYears(
        [toYear(2018), toYear(2021), toYear(2030)],
        2026,
        toYear(2018)
      )
    ).toBe(4);
  });
});
