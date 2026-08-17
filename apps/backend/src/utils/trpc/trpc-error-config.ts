import { TRPCError } from '@trpc/server';

/**
 * Configuration d'une erreur : son code TRPC, et un message facultatif.
 *
 * Sans message, le code interne est renvoyé tel quel — il voyage aussi dans
 * `data.errorKey` — et c'est au client de le traduire. À préférer pour les
 * erreurs destinées à l'app : les libellés vivent dans son catalogue, pas ici.
 */
export type ErrorConfig = {
  code: TRPCError['code'];
  message?: string;
};

/**
 * Correspondances entre un code erreur et la configuration de l'erreur TRPC
 */
export type ErrorConfigMap<SpecificError extends string> = Record<
  SpecificError,
  ErrorConfig
>;
