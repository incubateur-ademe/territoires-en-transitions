import {
  BadRequestException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { EstimationError } from 'leviers-ges';
import { match } from 'ts-pattern';

/**
 * Traduit une erreur d'estimation en exception HTTP.
 * Les détails d'un jeu de données invalide (erreur serveur) ne sont pas exposés.
 */
export const toLeviersGesHttpException = (
  error: EstimationError
): HttpException =>
  match(error)
    .with(
      { kind: 'invalid_request' },
      ({ issues }) =>
        new BadRequestException({ message: 'Requête invalide', issues })
    )
    .with(
      { kind: 'unknown_territory' },
      ({ level, code }) =>
        new NotFoundException(`Territoire inconnu (${level} ${code})`)
    )
    .with(
      { kind: 'level_not_computed' },
      ({ lever, level }) =>
        new UnprocessableEntityException(
          `Le levier ${lever} n'est pas calculé au niveau ${level}`
        )
    )
    .with(
      { kind: 'missing_data' },
      ({ dataset, key }) =>
        new UnprocessableEntityException(
          `Données manquantes pour ce territoire (${dataset}, ${key})`
        )
    )
    .with(
      { kind: 'invalid_dataset' },
      () =>
        new InternalServerErrorException(
          'Les données de calcul sont indisponibles'
        )
    )
    .exhaustive();
