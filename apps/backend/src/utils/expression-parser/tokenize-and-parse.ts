import { CstNode } from 'chevrotain';
import { ExpressionParser } from './expression-parser';
import {
  formatLexingErrors,
  formatParsingErrors,
} from './format-expression-errors.utils';
import { InvalidExpressionError } from './invalid-expression.error';

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
      formatLexingErrors(lexingResult.errors, { source }),
      { cause: lexingResult.errors }
    );
  }
  parser.input = lexingResult.tokens;
  const cst = parser.statement();
  if (parser.errors.length > 0) {
    throw new InvalidExpressionError(
      formatParsingErrors(parser.errors, {
        source,
        functionNames: parser.functionNames,
        tokens: lexingResult.tokens,
      }),
      { cause: parser.errors }
    );
  }
  return cst;
}
