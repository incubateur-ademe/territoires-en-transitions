import { ILexingError, IRecognitionException, IToken } from 'chevrotain';

export type FormatExpressionErrorsOptions = {
  source: string;
};

type ErrorLocation = {
  line: number;
  column: number;
  length: number;
};

const INDENT = '  ';

function isPosition(value: number | undefined): value is number {
  return value !== undefined && Number.isFinite(value);
}

function getSourceLines(source: string): string[] {
  return source.split(/\r?\n/);
}

// position juste après la fin du texte, pour une erreur sans token positionné
function getEndOfSourceLocation(source: string): ErrorLocation {
  const lines = getSourceLines(source);
  const lastLine = lines[lines.length - 1] ?? '';
  return {
    line: lines.length,
    column: lastLine.trimEnd().length + 1,
    length: 1,
  };
}

function getParsingErrorLocation(
  error: IRecognitionException,
  source: string
): ErrorLocation {
  const { token } = error;
  if (isPosition(token.startLine) && isPosition(token.startColumn)) {
    const length =
      isPosition(token.endLine) &&
      token.endLine === token.startLine &&
      isPosition(token.endColumn)
        ? token.endColumn - token.startColumn + 1
        : 1;
    return { line: token.startLine, column: token.startColumn, length };
  }

  // fin d'expression inattendue (token EOF, non positionné) : on se place
  // juste après le dernier token consommé
  const previousToken =
    'previousToken' in error ? (error.previousToken as IToken) : null;
  if (
    previousToken &&
    isPosition(previousToken.endLine) &&
    isPosition(previousToken.endColumn)
  ) {
    return {
      line: previousToken.endLine,
      column: previousToken.endColumn + 1,
      length: 1,
    };
  }
  return getEndOfSourceLocation(source);
}

// extrait de la ligne fautive, suivi d'un curseur sous la zone en erreur
function formatErrorWithExcerpt(
  location: ErrorLocation,
  message: string,
  source: string
): string {
  const sourceLine = (
    getSourceLines(source)[location.line - 1] ?? ''
  ).trimEnd();
  // les tabulations sont conservées pour que le curseur reste aligné
  const cursorPrefix = sourceLine
    .slice(0, location.column - 1)
    .replace(/[^\t]/g, ' ')
    .padEnd(location.column - 1, ' ');
  const cursor = '^'.repeat(Math.max(1, location.length));
  return [
    `(ligne ${location.line}, colonne ${location.column}) :`,
    `${INDENT}${sourceLine}`,
    `${INDENT}${cursorPrefix}${cursor}`,
    message,
  ].join('\n');
}

/**
 * Formate une erreur de parsing avec l'extrait de la ligne fautive.
 * Le parser n'a pas de recovery : seule la première erreur est significative.
 */
export function formatParsingErrors(
  errors: IRecognitionException[],
  options: FormatExpressionErrorsOptions
): string {
  const [error] = errors;
  if (!error) {
    return 'Expression invalide';
  }
  return formatErrorWithExcerpt(
    getParsingErrorLocation(error, options.source),
    `${error.name}: ${error.message}`,
    options.source
  );
}

/**
 * Formate toutes les erreurs du lexer (un bloc par erreur), en citant le ou
 * les caractères non reconnus.
 */
export function formatLexingErrors(
  errors: ILexingError[],
  options: FormatExpressionErrorsOptions
): string {
  const { source } = options;
  return errors
    .map((error) => {
      const fragment = source.substring(
        error.offset,
        error.offset + error.length
      );
      const location: ErrorLocation =
        isPosition(error.line) && isPosition(error.column)
          ? { line: error.line, column: error.column, length: error.length }
          : getEndOfSourceLocation(source);
      return formatErrorWithExcerpt(
        location,
        `Caractère non reconnu « ${fragment} »`,
        source
      );
    })
    .join('\n');
}
