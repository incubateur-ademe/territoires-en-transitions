export type SchemaIssue = {
  path: (string | number)[];
  code: string;
};

export type LlmError =
  | { kind: 'rate_limited' }
  | { kind: 'truncated' }
  | { kind: 'invalid_json'; rawTextLength: number; schemaIssue?: SchemaIssue }
  | { kind: 'api_error'; httpStatus: number | null }
  | { kind: 'unsupported'; feature: 'images' | 'ocr' };

/** L'erreur en une ligne, pour un avertissement : la règle violée pour un JSON invalide. */
export const describeLlmError = (error: LlmError): string => {
  if (error.kind === 'invalid_json' && error.schemaIssue) {
    const path = error.schemaIssue.path.join('.') || 'racine';
    return `invalid_json (${path} : ${error.schemaIssue.code})`;
  }
  if (error.kind === 'api_error' && error.httpStatus !== null) {
    return `api_error ${error.httpStatus}`;
  }
  return error.kind;
};
