import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { failure, success } from '@tet/backend/utils/result.type';
import { fromListIndicateursFailure } from '../../valeurs/indicateur-valeurs.errors';
import {
  getListIndicateursDataOrThrow,
  listIndicateursErrorConfig,
} from './list-indicateurs.errors';

describe('getListIndicateursDataOrThrow', () => {
  it('retourne la donnée d’un succès', () => {
    expect(getListIndicateursDataOrThrow(success(7))).toBe(7);
  });

  it('relance un refus en ForbiddenException avec le message de la cause', () => {
    const refus = failure(
      'UNAUTHORIZED' as const,
      new Error('Droits insuffisants')
    );

    expect(() => getListIndicateursDataOrThrow(refus)).toThrow(
      new ForbiddenException('Droits insuffisants')
    );
  });

  it('relance un indicateur introuvable en BadRequestException avec le message de la cause', () => {
    const introuvable = failure(
      'INDICATEUR_NOT_FOUND' as const,
      new Error('Indicateur not found for id 42')
    );

    expect(() => getListIndicateursDataOrThrow(introuvable)).toThrow(
      new BadRequestException('Indicateur not found for id 42')
    );
  });

  it('relance un échec de lecture en InternalServerErrorException portant la cause', () => {
    const cause = new Error(
      'Indicateur 7 : nature incohérente (PERSO_WITH_GROUPEMENT)'
    );

    expect(() =>
      getListIndicateursDataOrThrow(failure('DATABASE_ERROR' as const, cause))
    ).toThrow(
      expect.objectContaining({
        constructor: InternalServerErrorException,
        message: cause.message,
        cause,
      })
    );
  });
});

describe('listIndicateursErrorConfig', () => {
  it('garde les codes d’avant : refus en FORBIDDEN, introuvable en BAD_REQUEST, lecture en INTERNAL_SERVER_ERROR, avec le message de la cause', () => {
    expect({
      refus: listIndicateursErrorConfig.commonErrors?.UNAUTHORIZED,
      lecture: listIndicateursErrorConfig.commonErrors?.DATABASE_ERROR,
      introuvable:
        listIndicateursErrorConfig.specificErrors?.INDICATEUR_NOT_FOUND,
    }).toEqual({
      refus: { code: 'FORBIDDEN', messageFromCause: true },
      lecture: { code: 'INTERNAL_SERVER_ERROR', messageFromCause: true },
      introuvable: { code: 'BAD_REQUEST', messageFromCause: true },
    });
  });
});

describe('fromListIndicateursFailure', () => {
  it.each([
    ['UNAUTHORIZED', 'UNAUTHORIZED'],
    ['INDICATEUR_NOT_FOUND', 'INVALID_VALUE'],
    ['DATABASE_ERROR', 'DATABASE_ERROR'],
  ] as const)(
    'convertit %s en %s en gardant la cause',
    (listError, valeursError) => {
      const cause = new Error('cause d’origine');

      expect(fromListIndicateursFailure({ error: listError, cause })).toEqual(
        failure(valeursError, cause)
      );
    }
  );
});
