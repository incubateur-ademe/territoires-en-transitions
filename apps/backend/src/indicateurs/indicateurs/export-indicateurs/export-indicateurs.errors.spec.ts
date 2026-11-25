import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { createControllerErrorHandler } from '@tet/backend/utils/nest/controller-error-handler';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it } from 'vitest';
import {
  exportIndicateursErrorConfig,
  toExportTooLargeFailure,
} from './export-indicateurs.errors';

const getResultDataOrThrowError = createControllerErrorHandler(
  exportIndicateursErrorConfig
);

describe('exportIndicateursErrorConfig, vu depuis le controller', () => {
  it('retourne la donnée d’un succès', () => {
    expect(getResultDataOrThrowError(success(7))).toBe(7);
  });

  it.each([
    [
      'UNAUTHORIZED' as const,
      new ForbiddenException('Droits insuffisants'),
      'Droits insuffisants',
    ],
    [
      'INDICATEUR_NOT_FOUND' as const,
      new BadRequestException('Indicateur not found for id 1'),
      'Indicateur not found for id 1',
    ],
    [
      'NOT_FOUND' as const,
      new NotFoundException('Collectivité introuvable'),
      'Collectivité introuvable',
    ],
    [
      'DATABASE_ERROR' as const,
      new InternalServerErrorException('lecture impossible'),
      'lecture impossible',
    ],
  ])(
    'relance %s avec le statut et le message d’avant',
    (error, expected, message) => {
      const thrown = (() => {
        try {
          getResultDataOrThrowError(failure(error, new Error(message)));
        } catch (caught) {
          return caught;
        }
      })();

      expect(thrown).toEqual(expected);
    }
  );

  it('relance un export trop volumineux en PayloadTooLargeException avec le même message', () => {
    const thrown = (() => {
      try {
        getResultDataOrThrowError(toExportTooLargeFailure(5000));
      } catch (caught) {
        return caught;
      }
    })();

    expect(thrown).toEqual(
      new PayloadTooLargeException(
        "L'export dépasse la limite technique de 5000 indicateurs"
      )
    );
  });
});
