import { TRPCError } from '@trpc/server';

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
