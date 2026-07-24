import { describe, expect, it } from 'vitest';
import { toYear } from './types';
import {
  isObjectifEditable,
  isResultatEditable,
  pasteFieldForYear,
} from './cell-editability';

describe('cell-editability', () => {
  it('autorise le résultat seulement si year <= now', () => {
    expect(isResultatEditable(toYear(2024), 2026)).toBe(true);
    expect(isResultatEditable(toYear(2026), 2026)).toBe(true);
    expect(isResultatEditable(toYear(2027), 2026)).toBe(false);
  });

  it('autorise toujours l’objectif', () => {
    expect(isObjectifEditable(toYear(2024), 2026)).toBe(true);
    expect(isObjectifEditable(toYear(2030), 2026)).toBe(true);
  });

  it('cible le champ collage selon now', () => {
    expect(pasteFieldForYear(toYear(2024), 2026)).toBe('resultat');
    expect(pasteFieldForYear(toYear(2027), 2026)).toBe('objectif');
  });
});
