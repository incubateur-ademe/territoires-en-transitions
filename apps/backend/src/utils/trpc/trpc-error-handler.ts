import { createEnumObject } from '@tet/domain/utils';
import { TRPCError } from '@trpc/server';
import { Result } from '../result.type';
import {
  COMMON_ERROR_CONFIG,
  CommonError,
  commonErrors,
} from './common-errors';
import { ErrorConfig, ErrorConfigMap } from './trpc-error-config';

/**
 * Configuration pour créer un handler d'erreurs TRPC
 */
export type TrpcErrorHandlerConfig<SpecificError extends string> = {
  /**
   * Permet de surcharger les messages/codes des erreurs communes si nécessaire
   */
  commonErrors?: Partial<Record<CommonError, ErrorConfig>>;
  /**
   * Erreurs spécifiques au router/service
   */
  specificErrors?: Record<SpecificError, ErrorConfig>;
};

/**
 * Crée l'enum combinant les codes erreur communs et ceux fournis
 */
export function createErrorsEnum<SpecificError extends string = never>(
  specificErrors?: readonly [SpecificError, ...SpecificError[]]
) {
  return createEnumObject([...(specificErrors || []), ...commonErrors]);
}

/**
 * Crée un handler d'erreurs TRPC générique qui fusionne la configuration des
 * erreurs communes avec celle pour les erreurs spécifiques.
 *
 * @example
 * ```typescript
 * const getResultDataOrThrowError = createTrpcErrorHandler({
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
export function createTrpcErrorHandler<SpecificError extends string>(
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
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: "Une erreur inattendue s'est produite",
      });
    }

    throw new TRPCError({
      code: errorConfig.code,
      message: errorConfig.message,
    });
  };
}
