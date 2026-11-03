import { LlmError } from '@tet/backend/utils/llm/llm.errors';

export type ClassifyFicheFailure =
  | LlmError
  | { kind: 'unknown_enjeu'; enjeu: string };
