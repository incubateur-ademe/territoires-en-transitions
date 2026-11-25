import { NotFoundException } from '@nestjs/common';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it } from 'vitest';
import {
  calculTrajectoireErrorConfig,
  rethrowHttpExceptionCause,
} from './calcul-trajectoire.errors';

describe('calculTrajectoireErrorConfig', () => {
  it('garde les codes d’avant : trajectoire non calculable en UNPROCESSABLE_CONTENT, erreur serveur en INTERNAL_SERVER_ERROR, avec le message de la cause', () => {
    expect({
      nonCalculable:
        calculTrajectoireErrorConfig.specificErrors?.UNPROCESSABLE_TRAJECTOIRE,
      serveur: calculTrajectoireErrorConfig.commonErrors?.SERVER_ERROR,
    }).toEqual({
      nonCalculable: { code: 'UNPROCESSABLE_CONTENT', messageFromCause: true },
      serveur: { code: 'INTERNAL_SERVER_ERROR', messageFromCause: true },
    });
  });
});

describe('rethrowHttpExceptionCause', () => {
  it('laisse passer un succès', () => {
    const result = success(1);

    expect(rethrowHttpExceptionCause(result)).toBe(result);
  });

  it('laisse passer un échec dont la cause n’est pas une exception HTTP', () => {
    const result = failure('DATABASE_ERROR' as const, new Error('sql'));

    expect(rethrowHttpExceptionCause(result)).toBe(result);
  });

  it('relance la cause quand elle est une exception HTTP', () => {
    const cause = new NotFoundException('Collectivité introuvable');

    expect(() =>
      rethrowHttpExceptionCause(failure('DATABASE_ERROR' as const, cause))
    ).toThrow(cause);
  });
});
