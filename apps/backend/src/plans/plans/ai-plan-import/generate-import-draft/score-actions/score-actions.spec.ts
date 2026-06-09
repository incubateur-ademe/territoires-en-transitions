import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { describe, expect, it } from 'vitest';
import { ExtractedAction } from '../../models/extracted-action';
import { scoreActions } from './score-actions';
import { ScoringEntry } from './score-actions.schema';

const tokens: TokenUsage = {
  promptTokens: 80,
  candidatesTokens: 20,
  thoughtsTokens: 5,
  totalTokens: 105,
};

const anAction = (titre: string): ExtractedAction => ({
  axe: 'Axe 1',
  sousAxe: '1.1',
  titre,
  description: null,
  objectifs: null,
  structurePilote: null,
  directionServicePilote: null,
  personnePilote: null,
  budget: null,
  statut: null,
  confidence: null,
  sousActions: [],
});

const llmReturning = (
  result: Result<{ data: ScoringEntry[]; tokens: TokenUsage }, never>
): Pick<LlmService, 'generateStructured'> =>
  ({
    generateStructured: async () => result,
  } as unknown as Pick<LlmService, 'generateStructured'>);

describe('scoreActions', () => {
  it('attache les scores aux actions et propage les tokens', async () => {
    const llm = llmReturning(
      success({
        data: [{ index: 0, score: 92, explication: '' }],
        tokens,
      })
    );

    const result = await scoreActions(llm, {
      actions: [anAction('A')],
      text: 'texte source',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.actions[0].confidence).toEqual({
        score: 92,
        explication: '',
        amelioree: false,
      });
      expect(result.data.tokens).toEqual(tokens);
    }
  });

  it('propage l erreur du LLM', async () => {
    const llm = {
      generateStructured: async () => failure({ kind: 'rate_limited' }),
    } as unknown as Pick<LlmService, 'generateStructured'>;

    const result = await scoreActions(llm, {
      actions: [anAction('A')],
      text: 'texte source',
    });

    expect(result).toMatchObject({
      success: false,
      error: { kind: 'rate_limited' },
    });
  });
});
