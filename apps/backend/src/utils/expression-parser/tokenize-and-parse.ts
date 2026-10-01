import { CstNode, ILexingError } from 'chevrotain';
import { ExpressionParser } from './expression-parser';
import { getFormmattedErrors } from './get-formatted-errors.utils';
import { InvalidExpressionError } from './invalid-expression.error';

// formate les erreurs du lexer en citant le caractère non reconnu et sa position
export function formatLexingErrors(
  source: string,
  errors: ILexingError[]
): string {
  return errors
    .map((e) => {
      const fragment = source.substring(e.offset, e.offset + e.length);
      return `Caractère non reconnu « ${fragment} » (${e.line ?? '?'}:${
        e.column ?? '?'
      })`;
    })
    .join(', ');
}

/**
 * Tokenise puis parse une expression. Lève `InvalidExpressionError` sur toute
 * erreur du lexer (caractère non reconnu, qui serait sinon ignoré sans bruit)
 * ou du parser.
 */
export function tokenizeAndParse(
  parser: ExpressionParser,
  source: string
): CstNode {
  const lexingResult = parser.lexer.tokenize(source);
  if (lexingResult.errors.length > 0) {
    throw new InvalidExpressionError(
      formatLexingErrors(source, lexingResult.errors),
      { cause: lexingResult.errors }
    );
  }
  parser.input = lexingResult.tokens;
  const cst = parser.statement();
  if (parser.errors.length > 0) {
    throw new InvalidExpressionError(getFormmattedErrors(parser.errors), {
      cause: parser.errors,
    });
  }
  return cst;
}
