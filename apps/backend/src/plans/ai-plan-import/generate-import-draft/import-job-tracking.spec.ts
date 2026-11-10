import { describe, expect, it } from 'vitest';
import type { ImportStepRun } from '../models/import-step-run';
import { stepRunTrackingProperties } from './import-job-tracking';

const call = (overrides: Partial<ImportStepRun['calls'][number]> = {}) => ({
  tier: 'standard' as never,
  model: 'gpt-oss-120b',
  attempt: 0,
  durationMs: 10,
  promptChars: 100,
  usage: {
    promptTokens: 8,
    cachedTokens: 0,
    candidatesTokens: 2,
    thoughtsTokens: 0,
    totalTokens: 10,
  },
  error: null,
  ...overrides,
});

describe('stepRunTrackingProperties', () => {
  it('résume les appels de l’étape sans son message d’erreur', () => {
    const run: ImportStepRun = {
      step: 'extraction',
      status: 'failed',
      startedAt: new Date('2026-11-10T10:00:00Z'),
      endedAt: new Date('2026-11-10T10:00:03Z'),
      calls: [
        call(),
        call({ model: 'ministral-3-8b', error: { kind: 'rate_limited' } }),
        call({ usage: null, error: { kind: 'truncated' } }),
      ],
      details: {},
      error: 'Extrait du document importé',
    };

    const properties = stepRunTrackingProperties(run);

    expect(properties).toEqual({
      step: 'extraction',
      status: 'failed',
      durationMs: 3000,
      llmCalls: 3,
      failedCalls: 2,
      rateLimitedCalls: 1,
      totalTokens: 20,
      models: 'gpt-oss-120b,ministral-3-8b',
    });
    expect(JSON.stringify(properties)).not.toContain('Extrait');
  });
});
