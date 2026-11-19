import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { createControllerErrorHandler } from '@tet/backend/utils/nest/controller-error-handler';
import { failure, success } from '@tet/backend/utils/result.type';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { describe, expect, it } from 'vitest';
import {
  captureIndicateurValeursResult,
  getIndicateurValeursDataOrThrow,
  IndicateurValeursError,
  indicateurValeursErrorConfig,
  toCommonError,
} from './indicateur-valeurs.errors';

const toThrownValue = (operation: () => unknown): unknown => {
  try {
    operation();
  } catch (error) {
    return error;
  }
  return undefined;
};

describe('getIndicateurValeursDataOrThrow', () => {
  it('retourne les données d’un succès', () => {
    expect(getIndicateurValeursDataOrThrow(success(42))).toBe(42);
  });

  it('lance l’échec lui-même, sans le convertir en exception HTTP', () => {
    const result = failure<IndicateurValeursError>(
      'INVALID_VALUE',
      new Error('Valeur invalide')
    );

    const thrown = toThrownValue(() => getIndicateurValeursDataOrThrow(result));

    expect(thrown).toBe(result);
  });

  it.each([
    'UNAUTHORIZED',
    'INVALID_VALUE',
    'USER_VALUE_NOT_ALLOWED',
    'DATABASE_ERROR',
  ] as const)(
    'un échec %s relancé dans une capture est restitué avec son code et sa cause',
    async (error) => {
      const cause = new Error('détail précis');

      const captured = await captureIndicateurValeursResult(() =>
        getIndicateurValeursDataOrThrow(failure(error, cause))
      );

      expect(captured).toEqual({ success: false, error, cause });
    }
  );
});

describe('indicateurValeursErrorConfig', () => {
  const getResultDataOrThrow = createTrpcErrorHandler(
    indicateurValeursErrorConfig
  );
  const getControllerResultDataOrThrow = createControllerErrorHandler(
    indicateurValeursErrorConfig
  );

  it.each([
    { error: 'INVALID_VALUE', code: 'BAD_REQUEST' },
    { error: 'USER_VALUE_NOT_ALLOWED', code: 'BAD_REQUEST' },
    { error: 'UNAUTHORIZED', code: 'FORBIDDEN' },
  ] as const)(
    'tRPC : $error est lancée en $code avec le message de la cause',
    ({ error, code }) => {
      expect(() =>
        getResultDataOrThrow(failure(error, new Error('détail précis')))
      ).toThrow(expect.objectContaining({ code, message: 'détail précis' }));
    }
  );

  it.each([
    { error: 'INVALID_VALUE', exception: BadRequestException },
    { error: 'USER_VALUE_NOT_ALLOWED', exception: BadRequestException },
    { error: 'UNAUTHORIZED', exception: ForbiddenException },
  ] as const)(
    'REST : $error est lancée en exception HTTP avec le message de la cause',
    ({ error, exception }) => {
      const thrown = toThrownValue(() =>
        getControllerResultDataOrThrow(
          failure(error, new Error('détail précis'))
        )
      );

      expect(thrown).toBeInstanceOf(exception);
      expect(thrown).toMatchObject({ message: 'détail précis' });
    }
  );

  it('ne transmet pas le message de la cause d’une erreur de base de données', () => {
    expect(() =>
      getResultDataOrThrow(
        failure('DATABASE_ERROR', new Error('relation "x" does not exist'))
      )
    ).toThrow(
      expect.objectContaining({
        code: 'INTERNAL_SERVER_ERROR',
        message: "Une erreur de base de données s'est produite",
      })
    );
  });
});

describe('toCommonError', () => {
  it.each([
    { error: 'UNAUTHORIZED', expected: 'UNAUTHORIZED' },
    { error: 'DATABASE_ERROR', expected: 'DATABASE_ERROR' },
    { error: 'INVALID_VALUE', expected: 'SERVER_ERROR' },
    { error: 'USER_VALUE_NOT_ALLOWED', expected: 'SERVER_ERROR' },
  ] as const)('convertit $error en $expected', ({ error, expected }) => {
    expect(toCommonError(error)).toBe(expected);
  });
});
