import { describe, expect, test } from 'vitest';
import { isFieldAllowedForYear, yearOf } from './valeur-field.rules';

describe('yearOf', () => {
  test('extrait l année du champ dateValeur', () => {
    expect(yearOf('2030-01-01')).toBe(2030);
  });
});

describe('isFieldAllowedForYear', () => {
  const currentYear = 2026;

  test('un objectif est autorisé quelle que soit l année', () => {
    expect(
      isFieldAllowedForYear({ field: 'objectif', year: 2050, currentYear })
    ).toBe(true);
    expect(
      isFieldAllowedForYear({ field: 'objectif', year: 2019, currentYear })
    ).toBe(true);
  });

  test('un résultat est autorisé pour une année passée ou courante', () => {
    expect(
      isFieldAllowedForYear({ field: 'resultat', year: 2019, currentYear })
    ).toBe(true);
    expect(
      isFieldAllowedForYear({
        field: 'resultat',
        year: currentYear,
        currentYear,
      })
    ).toBe(true);
  });

  test('un résultat est refusé pour une année future', () => {
    expect(
      isFieldAllowedForYear({ field: 'resultat', year: 2030, currentYear })
    ).toBe(false);
  });
});
