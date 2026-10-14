import { LlmCallEvent } from '@tet/backend/utils/llm/llm-observer';
import { describe, expect, it } from 'vitest';
import { computeLlmCallDetails } from './compute-import-metrics';

const call = (overrides: Partial<LlmCallEvent>): LlmCallEvent => ({
  tier: 'strong',
  model: 'gemini-test',
  attempt: 1,
  durationMs: 100,
  promptChars: 1_000,
  usage: null,
  error: null,
  ...overrides,
});

describe('computeLlmCallDetails', () => {
  it("n'ajoute rien à une étape sans appel", () => {
    expect(computeLlmCallDetails([])).toEqual({});
  });

  it('relève durées, tentatives et un compteur par type d’erreur', () => {
    const details = computeLlmCallDetails([
      call({ durationMs: 1_200 }),
      call({
        attempt: 1,
        durationMs: 30_000,
        error: { kind: 'api_error', httpStatus: 503 },
      }),
      call({
        attempt: 2,
        durationMs: 400,
        error: { kind: 'api_error', httpStatus: 503 },
      }),
      call({
        attempt: 3,
        durationMs: 300,
        error: { kind: 'api_error', httpStatus: null },
      }),
      call({ durationMs: 50, error: { kind: 'rate_limited' } }),
      call({
        durationMs: 50,
        error: { kind: 'invalid_json', rawTextLength: 12 },
      }),
    ]);

    expect(details).toEqual({
      maxCallMs: 30_000,
      sumCallMs: 32_000,
      maxAttempt: 3,
      errors_http_503: 2,
      errors_api_error: 1,
      errors_rate_limited: 1,
      errors_invalid_json: 1,
    });
  });
});
