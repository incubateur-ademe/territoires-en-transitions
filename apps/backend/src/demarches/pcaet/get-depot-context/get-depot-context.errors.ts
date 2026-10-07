import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

/**
 * Aucune erreur propre : le contexte se lit ou se refuse (permission), et les
 * erreurs communes couvrent le reste.
 */
export const getDepotContextErrorConfig: TrpcErrorHandlerConfig<never> = {};

export const GetDepotContextErrorEnum = createErrorsEnum();
export type GetDepotContextError = keyof typeof GetDepotContextErrorEnum;
