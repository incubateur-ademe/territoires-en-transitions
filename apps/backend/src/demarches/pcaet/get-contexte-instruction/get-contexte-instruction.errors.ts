import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

/**
 * Aucune erreur propre à ce service : « cette collectivité n'est pas instruite
 * par toi » est une réponse — `success(null)` — et non un refus. Seules les
 * erreurs communes (serveur, base) restent possibles.
 */
export const getContexteInstructionErrorConfig: TrpcErrorHandlerConfig<never> =
  {};

export const GetContexteInstructionErrorEnum = createErrorsEnum();
export type GetContexteInstructionError =
  keyof typeof GetContexteInstructionErrorEnum;
