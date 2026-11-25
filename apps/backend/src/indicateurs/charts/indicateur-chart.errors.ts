import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { failure, Result } from '@tet/backend/utils/result.type';
import { ListIndicateursError } from '../indicateurs/list-indicateurs/list-indicateurs.errors';
import { IndicateurValeursError } from '../valeurs/indicateur-valeurs.errors';
import { ReadValeursError } from '../valeurs/read-valeurs.errors';

export type IndicateurChartError =
  | ListIndicateursError
  | ReadValeursError
  | 'INVALID_INPUT'
  | 'INDICATEUR_VALEURS_FAILED';

export const toInvalidChartInputFailure = (): Result<never, 'INVALID_INPUT'> =>
  failure(
    'INVALID_INPUT',
    new Error('Either indicateurId or identifiantReferentiel must be provided')
  );

export const toIndicateurValeursChartFailure = ({
  error,
  cause,
}: {
  error: IndicateurValeursError;
  cause?: Error;
}): Result<never, 'INDICATEUR_VALEURS_FAILED'> =>
  failure('INDICATEUR_VALEURS_FAILED', cause ?? new Error(error));

export const getIndicateurChartDataOrThrow = <Data>(
  result: Result<Data, IndicateurChartError>
): Data => {
  if (result.success) return result.data;
  const message = result.cause?.message ?? result.error;
  if (result.error === 'UNAUTHORIZED') throw new ForbiddenException(message);
  if (result.error === 'NOT_FOUND') throw new NotFoundException(message);
  if (
    result.error === 'INDICATEUR_NOT_FOUND' ||
    result.error === 'INVALID_INPUT'
  )
    throw new BadRequestException(message);
  if (result.error === 'INDICATEUR_VALEURS_FAILED')
    throw result.cause ?? new Error(result.error);
  throw new InternalServerErrorException(message, { cause: result.cause });
};
