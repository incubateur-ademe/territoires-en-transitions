import { IRecognitionException, IToken } from 'chevrotain';

// formate les erreurs de parsing pour inclure le code, le message et l'emplacement
export function getFormmattedErrors(errors: IRecognitionException[]) {
  return (
    errors
      .map((e) => {
        const previousToken =
          'previousToken' in e ? (e.previousToken as IToken) : null;
        const startLine = e.token.startLine || previousToken?.startLine;
        const startColumn = e.token.startColumn || previousToken?.startColumn;
        const endLine = e.token.endLine || previousToken?.endLine;
        const endColumn = e.token.endColumn || previousToken?.endColumn;
        const startLocation = `${startLine ?? '?'}:${startColumn ?? '?'}`;
        const endLocation =
          endLine !== undefined &&
          (startLine !== endLine || startColumn !== endColumn)
            ? ` --> ${endLine}:${endColumn}`
            : '';
        return `${e.name}: ${e.message} (${startLocation}${endLocation})`;
      })
      .join(', ') || 'Invalid expression'
  );
}
