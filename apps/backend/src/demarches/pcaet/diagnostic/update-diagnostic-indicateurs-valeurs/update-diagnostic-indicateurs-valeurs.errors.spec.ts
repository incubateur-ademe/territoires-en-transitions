import { failure } from '@tet/backend/utils/result.type';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { describe, expect, it } from 'vitest';
import {
  toUpdateDiagnosticFailure,
  updateDiagnosticIndicateursValeursErrorConfig,
} from './update-diagnostic-indicateurs-valeurs.errors';

describe('toUpdateDiagnosticFailure', () => {
  it.each([
    'UNAUTHORIZED',
    'INVALID_VALUE',
    'INDICATEUR_NOT_AVAILABLE',
    'PERIODICITE_MISMATCH',
    'USER_VALUE_NOT_ALLOWED',
    'DATABASE_ERROR',
  ] as const)('conserve le code %s et sa cause', (error) => {
    const cause = new Error('détail précis');

    const mapped = toUpdateDiagnosticFailure({ success: false, error, cause });

    expect(mapped).toMatchObject({ success: false, error });
    expect(mapped.success ? undefined : mapped.cause).toBe(cause);
  });
});

describe('updateDiagnosticIndicateursValeursErrorConfig', () => {
  const getResultDataOrThrow = createTrpcErrorHandler(
    updateDiagnosticIndicateursValeursErrorConfig
  );

  it.each([
    'INVALID_VALUE',
    'INDICATEUR_NOT_AVAILABLE',
    'PERIODICITE_MISMATCH',
    'USER_VALUE_NOT_ALLOWED',
  ] as const)(
    '%s est lancée en BAD_REQUEST avec le message de la cause',
    (error) => {
      expect(() =>
        getResultDataOrThrow(failure(error, new Error('détail précis')))
      ).toThrow(
        expect.objectContaining({
          code: 'BAD_REQUEST',
          message: 'détail précis',
        })
      );
    }
  );
});
