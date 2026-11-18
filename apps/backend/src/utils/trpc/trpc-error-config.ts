import { TRPCError } from '@trpc/server';

/**
 * Configuration d'une erreur : son code TRPC, et soit un message facultatif,
 * soit `messageFromCause` pour renvoyer le message de la cause.
 *
 * Sans message, le code interne est renvoyé tel quel — il voyage aussi dans
 * `data.errorKey` — et c'est au client de le traduire. À préférer pour les
 * erreurs destinées à l'app : les libellés vivent dans son catalogue, pas ici.
 *
 * `messageFromCause` est réservé aux erreurs dont la cause est écrite pour être
 * lue par l'appelant (API externe) : jamais pour une cause interne. Sans cause
 * ou avec un message vide, on retombe sur le comportement « sans message ».
 */
export type ErrorConfig = {
  code: TRPCError['code'];
} & (
  | { message?: string; messageFromCause?: undefined }
  | { message?: undefined; messageFromCause: true }
);

export const getConfiguredErrorMessage = (
  errorConfig: ErrorConfig,
  cause: Error | undefined
): string | undefined =>
  errorConfig.messageFromCause
    ? cause?.message || undefined
    : errorConfig.message;

/**
 * Correspondances entre un code erreur et la configuration de l'erreur TRPC
 */
export type ErrorConfigMap<SpecificError extends string> = Record<
  SpecificError,
  ErrorConfig
>;
