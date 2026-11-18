import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { createControllerErrorHandler } from '@tet/backend/utils/nest/controller-error-handler';
import { failure } from '@tet/backend/utils/result.type';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { describe, expect, it } from 'vitest';
import {
  getIndicateurValeursDataOrThrow,
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
  it('relance un échec INVALID_VALUE en BadRequestException portant le message de la cause', () => {
    const thrown = toThrownValue(() =>
      getIndicateurValeursDataOrThrow(
        failure('INVALID_VALUE', new Error('Valeur invalide'))
      )
    );

    expect(thrown).toBeInstanceOf(BadRequestException);
    expect(thrown).toMatchObject({ message: 'Valeur invalide' });
  });

  it('relance un échec UNAUTHORIZED en ForbiddenException portant le message de la cause', () => {
    const thrown = toThrownValue(() =>
      getIndicateurValeursDataOrThrow(
        failure('UNAUTHORIZED', new Error('Accès refusé'))
      )
    );

    expect(thrown).toBeInstanceOf(ForbiddenException);
    expect(thrown).toMatchObject({ message: 'Accès refusé' });
  });

  it('relance telle quelle une cause déjà HTTP', () => {
    const cause = new ForbiddenException('déjà HTTP');

    const thrown = toThrownValue(() =>
      getIndicateurValeursDataOrThrow(failure('UNAUTHORIZED', cause))
    );

    expect(thrown).toBe(cause);
  });

  it('utilise le code comme message quand un échec INVALID_VALUE n’a pas de cause', () => {
    const thrown = toThrownValue(() =>
      getIndicateurValeursDataOrThrow(failure('INVALID_VALUE'))
    );

    expect(thrown).toBeInstanceOf(BadRequestException);
    expect(thrown).toMatchObject({ message: 'INVALID_VALUE' });
  });

  it('relance la cause d’un échec USER_VALUE_NOT_ALLOWED sans la convertir', () => {
    const cause = new Error('indicateur protégé');

    const thrown = toThrownValue(() =>
      getIndicateurValeursDataOrThrow(failure('USER_VALUE_NOT_ALLOWED', cause))
    );

    expect(thrown).toBe(cause);
  });

  it('relance la cause d’un échec DATABASE_ERROR sans la convertir', () => {
    const cause = new Error('connexion perdue');

    const thrown = toThrownValue(() =>
      getIndicateurValeursDataOrThrow(failure('DATABASE_ERROR', cause))
    );

    expect(thrown).toBe(cause);
  });
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
