export type SchemaIssue = {
  path: (string | number)[];
  code: string;
};

export type LlmError =
  | { kind: 'rate_limited' }
  | { kind: 'truncated' }
  | { kind: 'invalid_json'; rawTextLength: number; schemaIssue?: SchemaIssue }
  | { kind: 'api_error'; httpStatus: number | null };
