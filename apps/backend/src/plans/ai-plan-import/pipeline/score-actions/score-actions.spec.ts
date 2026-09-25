import { TokenUsage } from '@tet/backend/utils/llm/token-usage';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { describe, expect, it } from 'vitest';
import { ExtractedAction } from '../../models/extracted-action';
import { scoreActions } from './score-actions';
import { ScoringEntry } from './score-actions.schema';
import { wholeDocument } from '../source-chunks/source-chunks';

const inWholeDocument = (actions: ExtractedAction[]) => ({
  actions,
  source: wholeDocument('texte source', actions.length),
});

const tokens: TokenUsage = {
  promptTokens: 80,
  cachedTokens: 0,
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
      ...inWholeDocument([anAction('A')]),
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
      ...inWholeDocument([anAction('A')]),
    });

    expect(result).toMatchObject({
      success: false,
      error: { kind: 'rate_limited' },
    });
  });

  it('note chaque tranche à part, avec son seul texte, et remet les index de la liste', async () => {
    const prompts: string[] = [];
    const llm = {
      generateStructured: async ({ prompt }: { prompt: string }) => {
        prompts.push(prompt);
        // Chaque tranche ne tient qu'une action, numérotée 0 dans son prompt.
        return success({
          data: [{ index: 0, score: 40, explication: '' }],
          tokens,
        });
      },
    } as unknown as Pick<LlmService, 'generateStructured'>;

    const result = await scoreActions(llm, {
      actions: [anAction('A'), anAction('B')],
      source: { chunks: ['TRANCHE_0', 'TRANCHE_1'], chunkIndexByAction: [0, 1] },
    });

    expect(prompts).toHaveLength(2);
    expect(prompts[0]).toContain('TRANCHE_0');
    expect(prompts[0]).not.toContain('TRANCHE_1');
    expect(prompts[1]).toContain('TRANCHE_1');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        result.data.actions.map((action) => action.confidence?.score)
      ).toEqual([40, 40]);
    }
  });
});
