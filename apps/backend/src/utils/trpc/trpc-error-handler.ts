import { TRPCError } from '@trpc/server';
import { createEnumObject } from '../enum.utils';
import { MethodResult } from '../result.type';
import {
  COMMON_ERROR_CONFIG,
  CommonError,
  CommonErrorEnum,
} from './common-errors';

/**
 * Configuration d'une erreur avec son code TRPC et son message
 */
export type ErrorConfig = {
  code: TRPCError['code'];
  message: string;
};

/**
 * Correspondances entre un code erreur et la configuration de l'erreur TRPC
 */
export type ErrorConfigMap<SpecificError extends string> = Record<
  SpecificError,
  ErrorConfig
>;

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
export function createErrorsEnum<SpecificError extends string>(
  specificErrors: readonly [SpecificError, ...SpecificError[]]
) {
  const SpecificErrorsEnum = createEnumObject(specificErrors);
  return {
    ...CommonErrorEnum,
    ...SpecificErrorsEnum,
  };
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
    result: MethodResult<Data, HandledError>
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
