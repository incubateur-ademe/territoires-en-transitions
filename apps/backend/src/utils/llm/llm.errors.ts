export type LlmError =
  | { kind: 'rate_limited' }
  | { kind: 'truncated' }
  | { kind: 'invalid_json'; rawTextLength: number }
  | { kind: 'api_error'; httpStatus: number | null };
