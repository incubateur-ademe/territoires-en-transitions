import { TokenUsage } from '@tet/backend/utils/llm/token-usage';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import {
  ActionConfidence,
  createEmptyExtractedAction,
  ExtractedAction,
} from '../../models/extracted-action';
import {
  CONSOLIDATION_BATCH_SIZE,
  consolidateActions,
} from './consolidate-actions';
import { wholeDocument } from '../source-chunks/source-chunks';

const inWholeDocument = (actions: ExtractedAction[]) => ({
  actions,
  source: wholeDocument('texte', actions.length),
});

const tokens: TokenUsage = {
  promptTokens: 10,
  cachedTokens: 0,
  candidatesTokens: 4,
  thoughtsTokens: 1,
  totalTokens: 15,
};

const confidence = (score: number): ActionConfidence => ({
  score,
  explication: '',
  amelioree: false,
});

const anAction = (titre: string, score: number | null): ExtractedAction =>
  createEmptyExtractedAction({
    axe: 'Axe 1',
    sousAxe: '1.1',
    titre,
    confidence: score === null ? null : confidence(score),
  });

const echoingLlm = (): Pick<LlmService, 'generateStructured'> =>
  ({
    generateStructured: vi.fn(async ({ prompt }: { prompt: string }) => {
      const indices = [...prompt.matchAll(/\|(\d+)\|/g)].map((match) =>
        Number(match[1])
      );
      return success({
        data: indices.map((index) => ({
          index,
          titre: `consolidée ${index}`,
          description: '',
          'sous-actions': [],
        })),
        tokens,
      });
    }),
  } as unknown as Pick<LlmService, 'generateStructured'>);

describe('consolidateActions', () => {
  it('ne fait aucun appel LLM quand toutes les actions ont un score >= 90', async () => {
    const llm = echoingLlm();

    const result = await consolidateActions(llm, {
      ...inWholeDocument([anAction('A', 95), anAction('B', null)]),
      disabledFields: [],
    });

    expect(llm.generateStructured).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: true });
    if (result.success) {
      expect(result.data.actions.map((action) => action.titre)).toEqual([
        'A',
        'B',
      ]);
      expect(result.data.tokens.totalTokens).toBe(0);
    }
  });

  it('consolide les actions à faible score sur plusieurs lots et somme les tokens', async () => {
    const count = CONSOLIDATION_BATCH_SIZE + 2;
    const actions = Array.from({ length: count }, (_, index) =>
      anAction(`Action ${index}`, 50)
    );
    const llm = echoingLlm();

    const result = await consolidateActions(llm, {
      ...inWholeDocument(actions),
      disabledFields: [],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      result.data.actions.forEach((action, index) => {
        expect(action.titre).toBe(`consolidée ${index}`);
        expect(action.confidence?.amelioree).toBe(true);
      });
      expect(result.data.tokens.totalTokens).toBe(tokens.totalTokens * 2);
    }
    expect(llm.generateStructured).toHaveBeenCalledTimes(2);
  });

  it("ignore une entrée dont l'index n'appartient pas au lot demandé", async () => {
    const llm = {
      generateStructured: async () =>
        success({
          data: [
            {
              index: 0,
              titre: 'consolidée 0',
              description: '',
              'sous-actions': [],
            },
            {
              index: 1,
              titre: 'CORROMPU',
              description: '',
              'sous-actions': [],
            },
          ],
          tokens,
        }),
    } as unknown as Pick<LlmService, 'generateStructured'>;

    const result = await consolidateActions(llm, {
      ...inWholeDocument([anAction('A', 50), anAction('B', 95)]),
      disabledFields: [],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.actions[0].titre).toBe('consolidée 0');
      expect(result.data.actions[1].titre).toBe('B');
      expect(result.data.actions[1].confidence?.amelioree).toBe(false);
    }
  });

  it('échoue si un lot échoue', async () => {
    const llm = {
      generateStructured: async () => failure({ kind: 'rate_limited' }),
    } as unknown as Pick<LlmService, 'generateStructured'>;

    const result = await consolidateActions(llm, {
      ...inWholeDocument([anAction('A', 50)]),
      disabledFields: [],
    });

    expect(result).toMatchObject({
      success: false,
      error: { kind: 'rate_limited' },
    });
  });

  it("ne mêle pas deux tranches dans un lot, et n'envoie que la tranche du lot", async () => {
    const llm = echoingLlm();

    const result = await consolidateActions(llm, {
      actions: [anAction('A', 50), anAction('B', 50)],
      source: {
        chunks: ['TRANCHE_0', 'TRANCHE_1'],
        chunkIndexByAction: [0, 1],
      },
      disabledFields: [],
    });

    const prompts = vi
      .mocked(llm.generateStructured)
      .mock.calls.map(([args]) => (args as { prompt: string }).prompt);
    const promptOf = (index: number) =>
      prompts.find((prompt) => prompt.includes(`|${index}|`));
    expect(prompts).toHaveLength(2);
    expect(promptOf(0)).toContain('TRANCHE_0');
    expect(promptOf(1)).toContain('TRANCHE_1');
    expect(promptOf(1)).not.toContain('TRANCHE_0');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.actions.map((action) => action.titre)).toEqual([
        'consolidée 0',
        'consolidée 1',
      ]);
    }
  });
});
