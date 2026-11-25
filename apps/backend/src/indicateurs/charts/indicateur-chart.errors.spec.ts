import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it } from 'vitest';
import {
  getIndicateurChartDataOrThrow,
  toIndicateurValeursChartFailure,
  toInvalidChartInputFailure,
} from './indicateur-chart.errors';

describe('getIndicateurChartDataOrThrow', () => {
  it('retourne la donnée d’un succès', () => {
    expect(getIndicateurChartDataOrThrow(success(7))).toBe(7);
  });

  it.each([
    ['UNAUTHORIZED', ForbiddenException],
    ['NOT_FOUND', NotFoundException],
    ['INDICATEUR_NOT_FOUND', BadRequestException],
    ['INVALID_INPUT', BadRequestException],
  ] as const)(
    'relance %s dans la classe d’exception d’avant avec le message de la cause',
    (error, exceptionClass) => {
      const cause = new Error('message de la cause');

      expect(() =>
        getIndicateurChartDataOrThrow(failure(error, cause))
      ).toThrow(
        expect.objectContaining({
          constructor: exceptionClass,
          message: 'message de la cause',
        })
      );
    }
  );

  it('relance un échec de lecture en InternalServerErrorException portant la cause', () => {
    const cause = new Error('connexion perdue');

    expect(() =>
      getIndicateurChartDataOrThrow(failure('DATABASE_ERROR' as const, cause))
    ).toThrow(
      expect.objectContaining({
        constructor: InternalServerErrorException,
        message: 'connexion perdue',
        cause,
      })
    );
  });

  it('relance la cause d’origine d’un échec des valeurs d’indicateur, sans l’envelopper', () => {
    const cause = new ForbiddenException('Droits insuffisants');
    let thrown: unknown;

    try {
      getIndicateurChartDataOrThrow(
        toIndicateurValeursChartFailure({ error: 'UNAUTHORIZED', cause })
      );
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBe(cause);
  });

  it('relance une erreur portant le code quand un échec des valeurs d’indicateur n’a pas de cause', () => {
    expect(() =>
      getIndicateurChartDataOrThrow(
        toIndicateurValeursChartFailure({ error: 'DATABASE_ERROR' })
      )
    ).toThrow(new Error('DATABASE_ERROR'));
  });
});

describe('toInvalidChartInputFailure', () => {
  it('porte le message de l’ancienne BadRequestException', () => {
    expect(toInvalidChartInputFailure()).toEqual(
      failure(
        'INVALID_INPUT',
        new Error(
          'Either indicateurId or identifiantReferentiel must be provided'
        )
      )
    );
  });
});
