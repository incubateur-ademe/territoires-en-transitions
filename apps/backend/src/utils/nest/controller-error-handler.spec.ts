import { describe, expect, it } from 'vitest';
import { failure, success } from '../result.type';
import { createControllerErrorHandler } from './controller-error-handler';

describe('createControllerErrorHandler', () => {
  it('returns successful service data', () => {
    const handleResult = createControllerErrorHandler();
    const data = { id: 42 };

    expect(handleResult(success(data))).toBe(data);
  });

  it.each([
    { code: 'NOT_FOUND', status: 404 },
    { code: 'TOO_MANY_REQUESTS', status: 429 },
  ] as const)(
    'carries the service error code and cause through $code responses',
    ({ code, status }) => {
      const handleResult = createControllerErrorHandler({
        specificErrors: {
          FICHE_UNAVAILABLE: { code, message: 'Fiche indisponible' },
        },
      });
      const cause = new Error('Service failure');

      expect(() =>
        handleResult(failure('FICHE_UNAVAILABLE', cause))
      ).toThrowError(
        expect.objectContaining({
          errorCode: 'FICHE_UNAVAILABLE',
          message: 'Fiche indisponible',
          status,
          cause,
        })
      );
    }
  );

  it('exposes the configured common error code and message', () => {
    const handleResult = createControllerErrorHandler();

    expect(() => handleResult(failure('DATABASE_ERROR'))).toThrowError(
      expect.objectContaining({
        errorCode: 'DATABASE_ERROR',
        message: "Une erreur de base de données s'est produite",
        status: 500,
      })
    );
  });

  it('preserves unmapped failure codes and causes in server errors', () => {
    const handleResult = createControllerErrorHandler<'UNMAPPED_FAILURE'>();
    const cause = new Error('Service failure');

    expect(() => handleResult(failure('UNMAPPED_FAILURE', cause))).toThrowError(
      expect.objectContaining({
        errorCode: 'UNMAPPED_FAILURE',
        message: 'UNMAPPED_FAILURE',
        status: 500,
        cause,
      })
    );
  });
});
