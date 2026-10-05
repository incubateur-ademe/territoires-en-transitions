import { IParserErrorMessageProvider, IToken, TokenType } from 'chevrotain';

// libellé des tokens tels que l'auteur d'une formule les écrit ; les autres
// (mots-clés) sont affichés par leur nom en minuscules
const TOKEN_LABELS: Record<string, string> = {
  LPAR: '« ( »',
  RPAR: '« ) »',
  COMMA: '« , »',
  COMP_OPERATOR: 'un opérateur de comparaison (=, <, >, <=, >=)',
  ADDITION_OPERATOR: '« + » ou « - »',
  MULTIPLICATION_OPERATOR: '« * » ou « / »',
  CNAME: 'un identifiant',
  NUMBER: 'un nombre',
  EOF: "la fin de l'expression",
};

function getExpectedLabel(tokenType: TokenType): string {
  return TOKEN_LABELS[tokenType.name] ?? `« ${tokenType.name.toLowerCase()} »`;
}

function getFoundLabel(token: IToken | undefined): string {
  if (!token || token.tokenType.name === 'EOF') {
    return TOKEN_LABELS.EOF;
  }
  return `« ${token.image} »`;
}

/**
 * Messages d'erreur du parser en français, à la place de ceux de Chevrotain
 * qui citent les noms internes des tokens (`ALORS`, `RPAR`…).
 */
export const parserErrorMessageProvider: IParserErrorMessageProvider = {
  buildMismatchTokenMessage: ({ expected, actual }) =>
    `Attendu ${getExpectedLabel(expected)}, trouvé ${getFoundLabel(actual)}.`,

  buildNotAllInputParsedMessage: ({ firstRedundant }) =>
    `Texte inattendu après la fin de l'expression : ${getFoundLabel(
      firstRedundant
    )}.`,

  buildNoViableAltMessage: ({ actual }) =>
    `Expression attendue, trouvé ${getFoundLabel(actual[0])}.`,

  buildEarlyExitMessage: ({ actual }) =>
    `Au moins un élément attendu, trouvé ${getFoundLabel(actual[0])}.`,
};
