import { DomainError } from './domain-error';

/**
 * Normalise une erreur capturée dans un catch (typiquement au sein d'une transaction).
 * Si c'est une `DomainError` avec un code reconnu dans l'enum → on l'utilise.
 * Sinon → renvoi le code erreur par défaut
 *
 * @see doc/adr/0012-pattern-result.md - Erreurs normalisées dans le cadre des transactions
 */
export function normalizeCaughtError<E extends Record<string, string>>(
  error: unknown,
  errorEnum: E,
  defaultError: E[keyof E]
): E[keyof E] {
  if (error instanceof DomainError && error.code in errorEnum) {
    return error.code as E[keyof E];
  }
  return defaultError;
}
