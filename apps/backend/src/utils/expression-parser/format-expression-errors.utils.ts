import { ILexingError, IRecognitionException, IToken } from 'chevrotain';
import { distance } from 'fastest-levenshtein';

export type FormatExpressionErrorsOptions = {
  source: string;
  // fonctions connues du DSL, pour signaler une fonction inconnue
  functionNames?: readonly string[];
  // flux de tokens du lexer, pour retrouver le token qui précède l'erreur
  tokens?: IToken[];
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

function getTokenLocation(token: IToken): ErrorLocation | null {
  if (!isPosition(token.startLine) || !isPosition(token.startColumn)) {
    return null;
  }
  const length =
    isPosition(token.endLine) &&
    token.endLine === token.startLine &&
    isPosition(token.endColumn)
      ? token.endColumn - token.startColumn + 1
      : 1;
  return { line: token.startLine, column: token.startColumn, length };
}

function getParsingErrorLocation(
  error: IRecognitionException,
  source: string
): ErrorLocation {
  const tokenLocation = getTokenLocation(error.token);
  if (tokenLocation) {
    return tokenLocation;
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

/**
 * Un nom de fonction inconnu est lexé comme un identifiant : l'erreur du
 * parser porte alors sur la parenthèse qui le suit. Renvoie cet identifiant
 * s'il est appelé comme une fonction (parenthèse collée), `si x (` restant une
 * erreur de syntaxe ordinaire.
 */
function getUnknownFunctionToken(
  error: IRecognitionException,
  tokens: IToken[] | undefined
): IToken | null {
  const lpar = error.token;
  if (!tokens || lpar.tokenType.name !== 'LPAR') {
    return null;
  }
  // `error.previousToken` n'existe pas sur une NotAllInputParsedException
  // (nom inconnu en tête d'expression) : on relit le flux de tokens
  const cname = tokens[tokens.indexOf(lpar) - 1];
  if (
    cname?.tokenType.name !== 'CNAME' ||
    !isPosition(cname.endOffset) ||
    cname.endOffset + 1 !== lpar.startOffset
  ) {
    return null;
  }
  return cname;
}

// fonction connue la plus proche du nom saisi ; à distance égale, la première
// dans l'ordre de `functionNames`
function getClosestFunctionName(
  name: string,
  functionNames: readonly string[]
): string | null {
  const lowerName = name.toLowerCase();
  // 1 pour un nom de moins de 6 lettres, 2 au-delà : un seuil fixe de 2
  // ferait suggérer `min` pour `moy`
  const maxDistance = Math.min(2, Math.max(1, Math.floor(name.length / 3)));
  let closest: string | null = null;
  let closestDistance = maxDistance + 1;
  for (const functionName of functionNames) {
    const functionDistance = distance(lowerName, functionName);
    if (functionDistance < closestDistance) {
      closest = functionName;
      closestDistance = functionDistance;
    }
  }
  return closest;
}

function getUnknownFunctionMessage(
  name: string,
  functionNames: readonly string[]
): string {
  const closest = getClosestFunctionName(name, functionNames);
  const hint = closest
    ? `Vouliez-vous dire « ${closest} » ?`
    : `Fonctions disponibles : ${functionNames.join(', ')}.`;
  return `Fonction inconnue « ${name} ». ${hint}`;
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
  const unknownFunction = getUnknownFunctionToken(error, options.tokens);
  if (unknownFunction && options.functionNames) {
    return formatErrorWithExcerpt(
      getTokenLocation(unknownFunction) ??
        getParsingErrorLocation(error, options.source),
      getUnknownFunctionMessage(unknownFunction.image, options.functionNames),
      options.source
    );
  }
  return formatErrorWithExcerpt(
    getParsingErrorLocation(error, options.source),
    error.message,
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
