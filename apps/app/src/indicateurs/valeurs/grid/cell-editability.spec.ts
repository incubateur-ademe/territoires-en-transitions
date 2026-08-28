import { describe, expect, it } from 'vitest';
import { isResultatEditable, valueFieldsForYear } from './cell-editability';

describe('cell-editability', () => {
  it('autorise le résultat seulement si year <= now', () => {
    expect(isResultatEditable(2024, 2026)).toBe(true);
    expect(isResultatEditable(2026, 2026)).toBe(true);
    expect(isResultatEditable(2027, 2026)).toBe(false);
  });

  it('n expose que resultat pour les années passées ou courantes', () => {
    expect(valueFieldsForYear(2024, 2026)).toEqual(['resultat']);
    expect(valueFieldsForYear(2026, 2026)).toEqual(['resultat']);
  });

  it('n expose que objectif pour les années futures', () => {
    expect(valueFieldsForYear(2027, 2026)).toEqual(['objectif']);
  });
});
