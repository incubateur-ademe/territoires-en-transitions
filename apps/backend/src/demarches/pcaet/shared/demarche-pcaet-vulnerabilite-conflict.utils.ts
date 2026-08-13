import { isErrorWithCause } from '@tet/backend/utils/nest/errors.utils';
import { PgIntegrityConstraintViolation } from '@tet/backend/utils/postgresql-error-codes.enum';

/**
 * Deux ajouts simultanés du même libellé passent tous deux la vérification
 * applicative : c'est l'index d'unicité qui arbitre, et son rejet doit
 * ressortir comme un conflit métier, pas comme une erreur serveur.
 */
export const isDomaineDejaExistant = (error: unknown): boolean =>
  isErrorWithCause(error) &&
  error.cause.code === PgIntegrityConstraintViolation.UniqueViolation;
