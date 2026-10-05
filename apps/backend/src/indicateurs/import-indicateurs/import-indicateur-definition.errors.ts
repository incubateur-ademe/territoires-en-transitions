import { HttpException, HttpStatus } from '@nestjs/common';
import { InvalidExpressionError } from '@tet/backend/utils/expression-parser';
import type { Result } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { upperFirst } from 'es-toolkit';

export type ImportIndicateurDefinitionError =
  | 'INVALID_IMPORT'
  | 'INVALID_EXPRESSION'
  | 'IMPORT_CONFLICT'
  | 'DATABASE_ERROR';

/**
 * Une erreur de syntaxe (`InvalidExpressionError`) porte déjà un extrait de la
 * ligne fautive : la formule n'est alors pas recopiée. Les autres erreurs
 * (référentiel inconnu, indicateur source inconnue…) n'ont pas de position et
 * gardent la formule.
 */
export function formatInvalidExpressionMessage(input: {
  label: string;
  expression: string;
  err: unknown;
}): string {
  const { label, expression, err } = input;
  if (err instanceof InvalidExpressionError) {
    return `${upperFirst(label)} est invalide ${err.message}`;
  }
  return `${upperFirst(label)} "${expression}" est invalide : ${getErrorMessage(
    err
  )}`;
}

/** Keeps the legacy import HTTP contract at its application facade. */
export function getImportResultOrThrow<T>(
  result: Result<T, ImportIndicateurDefinitionError>
): T {
  if (result.success) return result.data;
  const status = {
    INVALID_IMPORT: HttpStatus.BAD_REQUEST,
    INVALID_EXPRESSION: HttpStatus.UNPROCESSABLE_ENTITY,
    IMPORT_CONFLICT: HttpStatus.CONFLICT,
    DATABASE_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
  }[result.error];
  throw new HttpException(result.cause?.message ?? result.error, status);
}
