import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it } from 'vitest';
import {
  getReadValeursDataOrThrow,
  readValeursErrorConfig,
} from './read-valeurs.errors';

describe('getReadValeursDataOrThrow', () => {
  it('retourne la donnée d’un succès', () => {
    expect(getReadValeursDataOrThrow(success(7))).toBe(7);
  });

  it('relance un refus en ForbiddenException avec le message de la cause', () => {
    const unauthorizedFailure = failure(
      'UNAUTHORIZED' as const,
      new Error('Droits insuffisants')
    );

    expect(() => getReadValeursDataOrThrow(unauthorizedFailure)).toThrow(
      new ForbiddenException('Droits insuffisants')
    );
  });

  it('relance une collectivité introuvable en NotFoundException avec le message de la cause', () => {
    const notFoundFailure = failure(
      'NOT_FOUND' as const,
      new NotFoundException('Collectivité avec l’identifiant 3 introuvable')
    );

    expect(() => getReadValeursDataOrThrow(notFoundFailure)).toThrow(
      new NotFoundException('Collectivité avec l’identifiant 3 introuvable')
    );
  });

  it('relance un échec de lecture en InternalServerErrorException portant le message et la cause', () => {
    const cause = new Error('connexion perdue');

    expect(() =>
      getReadValeursDataOrThrow(failure('DATABASE_ERROR' as const, cause))
    ).toThrow(
      expect.objectContaining({
        constructor: InternalServerErrorException,
        message: cause.message,
        cause,
      })
    );
  });
});

describe('readValeursErrorConfig', () => {
  it('garde les codes d’avant, avec le message de la cause', () => {
    expect(readValeursErrorConfig.commonErrors).toEqual({
      UNAUTHORIZED: { code: 'FORBIDDEN', messageFromCause: true },
      NOT_FOUND: { code: 'NOT_FOUND', messageFromCause: true },
      DATABASE_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        messageFromCause: true,
      },
    });
  });
});
