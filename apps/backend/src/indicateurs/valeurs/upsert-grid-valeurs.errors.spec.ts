import { failure } from '@tet/backend/utils/result.type';
import { describe, expect, it } from 'vitest';
import { toGridFailure } from './upsert-grid-valeurs.errors';

describe('toGridFailure', () => {
  it.each([
    { error: 'INVALID_VALUE', expected: 'INVALID_GRID_VALEUR' },
    { error: 'INDICATEUR_NOT_AVAILABLE', expected: 'INVALID_GRID_VALEUR' },
    { error: 'PERIODICITE_MISMATCH', expected: 'INVALID_GRID_VALEUR' },
    { error: 'USER_VALUE_NOT_ALLOWED', expected: 'USER_VALUE_NOT_ALLOWED' },
    { error: 'UNAUTHORIZED', expected: 'UNAUTHORIZED' },
    { error: 'DATABASE_ERROR', expected: 'DATABASE_ERROR' },
  ] as const)(
    'convertit $error en $expected en conservant la cause',
    ({ error, expected }) => {
      const cause = new Error('détail précis');

      expect(toGridFailure({ success: false, error, cause })).toEqual(
        failure(expected, cause)
      );
    }
  );
});
