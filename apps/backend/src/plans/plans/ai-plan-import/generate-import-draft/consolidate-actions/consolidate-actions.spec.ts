import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import {
  ActionConfidence,
  ExtractedAction,
} from '../../models/extracted-action';
import {
  CONSOLIDATION_BATCH_SIZE,
  consolidateActions,
} from './consolidate-actions';

const tokens: TokenUsage = {
  promptTokens: 10,
  candidatesTokens: 4,
  thoughtsTokens: 1,
  totalTokens: 15,
};

const confidence = (score: number): ActionConfidence => ({
  score,
  explication: '',
  amelioree: false,
});

const anAction = (
  titre: string,
  score: number | null
): ExtractedAction => ({
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
  confidence: score === null ? null : confidence(score),
  sousActions: [],
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
      actions: [anAction('A', 95), anAction('B', null)],
      text: 'texte',
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
      actions,
      text: 'texte',
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

  it('échoue si un lot échoue', async () => {
    const llm = {
      generateStructured: async () => failure({ kind: 'rate_limited' }),
    } as unknown as Pick<LlmService, 'generateStructured'>;

    const result = await consolidateActions(llm, {
      actions: [anAction('A', 50)],
      text: 'texte',
      disabledFields: [],
    });

    expect(result).toMatchObject({
      success: false,
      error: { kind: 'rate_limited' },
    });
  });
});
