import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { failure, Result } from '@tet/backend/utils/result.type';
import { TrpcErrorHandlerConfig } from '@tet/backend/utils/trpc/trpc-error-handler';
import { ResourceType } from '@tet/domain/users';

export type ListIndicateursError =
  | 'UNAUTHORIZED'
  | 'INDICATEUR_NOT_FOUND'
  | 'DATABASE_ERROR';

export const listIndicateursErrorConfig: TrpcErrorHandlerConfig<'INDICATEUR_NOT_FOUND'> =
  {
    commonErrors: {
      UNAUTHORIZED: { code: 'FORBIDDEN', messageFromCause: true },
      DATABASE_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        messageFromCause: true,
      },
    },
    specificErrors: {
      INDICATEUR_NOT_FOUND: { code: 'BAD_REQUEST', messageFromCause: true },
    },
  };

export const readOperation = 'indicateurs.indicateurs.read';

export const toReadPermissionDeniedFailure = ({
  userId,
  collectiviteId,
  isApiKeyDenied,
}: {
  userId: string | null;
  collectiviteId: number;
  isApiKeyDenied: boolean;
}): Result<never, 'UNAUTHORIZED'> =>
  failure(
    'UNAUTHORIZED',
    new Error(
      isApiKeyDenied
        ? `Droits insuffisants, la clé d'api n'a pas l'autorisation ${readOperation}.`
        : `Droits insuffisants, l'utilisateur ${userId} n'a pas l'autorisation ${readOperation} sur la ressource ${ResourceType.COLLECTIVITE} ${collectiviteId}`
    )
  );

export const toIndicateurNotFoundFailure = (
  designation: string
): Result<never, 'INDICATEUR_NOT_FOUND'> =>
  failure(
    'INDICATEUR_NOT_FOUND',
    new Error(`Indicateur not found for ${designation}`)
  );

export const getListIndicateursDataOrThrow = <Data>(
  result: Result<Data, ListIndicateursError>
): Data => {
  if (result.success) return result.data;
  const message = result.cause?.message ?? result.error;
  if (result.error === 'UNAUTHORIZED') throw new ForbiddenException(message);
  if (result.error === 'INDICATEUR_NOT_FOUND')
    throw new BadRequestException(message);
  throw new InternalServerErrorException(message, { cause: result.cause });
};
