import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { failure } from '@tet/backend/utils/result.type';
import { describe, expect, it } from 'vitest';
import { getIndicateurValeursDataOrThrow } from './indicateur-valeurs.errors';

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
