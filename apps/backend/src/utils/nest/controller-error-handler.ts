import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  MethodNotAllowedException,
  NotFoundException,
  NotImplementedException,
  PayloadTooLargeException,
  PreconditionFailedException,
  RequestTimeoutException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { Result } from '../result.type';
import { COMMON_ERROR_CONFIG, CommonError } from '../trpc/common-errors';
import { ErrorConfigMap } from '../trpc/trpc-error-config';
import { TrpcErrorHandlerConfig } from '../trpc/trpc-error-handler';

function getHttpErrorFromTrpcErrorCode(
  code: TRPCError['code'],
  errorMessage?: string
): HttpException {
  switch (code) {
    case 'PARSE_ERROR':
      return new BadRequestException(errorMessage);
    case 'UNAUTHORIZED':
      return new UnauthorizedException(errorMessage);
    case 'FORBIDDEN':
      return new ForbiddenException(errorMessage);
    case 'NOT_FOUND':
      return new NotFoundException(errorMessage);
    case 'BAD_REQUEST':
      return new BadRequestException(errorMessage);
    case 'METHOD_NOT_SUPPORTED':
      return new MethodNotAllowedException(errorMessage);
    case 'TIMEOUT':
      return new RequestTimeoutException(errorMessage);
    case 'CONFLICT':
      return new ConflictException(errorMessage);
    case 'PRECONDITION_FAILED':
      return new PreconditionFailedException(errorMessage);
    case 'PAYLOAD_TOO_LARGE':
      return new PayloadTooLargeException(errorMessage);
    case 'UNPROCESSABLE_CONTENT':
      return new UnprocessableEntityException(errorMessage);
    case 'NOT_IMPLEMENTED':
      return new NotImplementedException(errorMessage);
    case 'UNSUPPORTED_MEDIA_TYPE':
      return new HttpException(
        errorMessage || 'Unsupported Media Type',
        HttpStatus.UNSUPPORTED_MEDIA_TYPE
      );
    case 'PRECONDITION_REQUIRED':
      return new HttpException(
        errorMessage || 'Precondition Required',
        HttpStatus.PRECONDITION_REQUIRED
      );
    case 'TOO_MANY_REQUESTS':
      return new HttpException(
        errorMessage || 'Too Many Requests',
        HttpStatus.TOO_MANY_REQUESTS
      );
    case 'CLIENT_CLOSED_REQUEST':
      return new HttpException(errorMessage || 'Client Closed Request', 499);
    case 'BAD_GATEWAY':
      return new HttpException(
        errorMessage || 'Bad Gateway',
        HttpStatus.BAD_GATEWAY
      );
    case 'SERVICE_UNAVAILABLE':
      return new HttpException(
        errorMessage || 'Service Unavailable',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    case 'GATEWAY_TIMEOUT':
      return new HttpException(
        errorMessage || 'Gateway Timeout',
        HttpStatus.GATEWAY_TIMEOUT
      );
    case 'INTERNAL_SERVER_ERROR':
      return new InternalServerErrorException(errorMessage);
    default:
      return new InternalServerErrorException(errorMessage);
  }
}
/**
 * Crée un handler d'erreurs Http controller générique qui fusionne la configuration des
 * erreurs communes avec celle pour les erreurs spécifiques.
 *
 * @example
 * ```typescript
 * const getResultDataOrThrowError = createControllerErrorHandler({
 *   specificErrors: {
 *     PLAN_NOT_FOUND: {
 *       code: 'NOT_FOUND',
 *       message: "Le plan demandé n'existe pas",
 *     },
 *    // optionnellement on peut surcharger la config des erreurs communes :
 *    commonErrors: {
 *      //...
 *    }
 *   },
 * });
 *
 * // renvoi les données résultat ou lance l'erreur appropriée
 * return getResultDataOrThrowError(result);
 * ```
 */
export function createControllerErrorHandler<SpecificError extends string>(
  config?: TrpcErrorHandlerConfig<SpecificError>
) {
  type HandledError = SpecificError | CommonError;

  // Fusionner toutes les erreurs (communes + spécifiques)
  const allErrors = {
    ...COMMON_ERROR_CONFIG,
    ...(config?.commonErrors || {}),
    ...(config?.specificErrors || {}),
  } as ErrorConfigMap<HandledError>;

  /**
   * Renvoi les données résultat ou lance la TRPCError appropriée
   */
  return function getResultDataOrThrowError<Data>(
    result: Result<Data, HandledError>
  ): Data | never {
    if (result.success) {
      return result.data;
    }

    const errorConfig = allErrors[result.error];

    if (!errorConfig) {
      throw new InternalServerErrorException(result.error);
    }

    throw getHttpErrorFromTrpcErrorCode(errorConfig.code, errorConfig.message);
  };
}
