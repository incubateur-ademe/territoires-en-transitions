import { TokenUsage } from '@tet/backend/utils/llm/token-usage';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import {
  createEmptyExtractedAction,
  ExtractedAction,
} from '../../models/extracted-action';
import { reviewQuality } from './qualitative-review';

const tokens: TokenUsage = {
  promptTokens: 10,
  cachedTokens: 0,
  candidatesTokens: 4,
  thoughtsTokens: 1,
  totalTokens: 15,
};

const action: ExtractedAction = createEmptyExtractedAction({
  axe: 'Axe 1',
  sousAxe: '1.1',
  titre: '1.1.1 Action',
});

describe('reviewQuality', () => {
  it("renvoie l'avis textuel et les tokens", async () => {
    const llm = {
      generateStructured: vi.fn(async () =>
        success({ data: { avis: 'Extraction cohérente' }, tokens })
      ),
    } as unknown as Pick<LlmService, 'generateStructured'>;

    const result = await reviewQuality(llm, { actions: [action] });

    expect(result).toMatchObject({
      success: true,
      data: { review: 'Extraction cohérente', tokens },
    });
    expect(llm.generateStructured).toHaveBeenCalledWith(
      expect.objectContaining({ thinkingLevel: 'low' })
    );
  });

  it("rend un avis absent et un avertissement quand l'appel échoue", async () => {
    const llm = {
      generateStructured: async () => failure({ kind: 'truncated' }),
    } as unknown as Pick<LlmService, 'generateStructured'>;

    const result = await reviewQuality(llm, { actions: [action] });

    expect(result).toMatchObject({
      success: true,
      data: {
        review: null,
        warnings: ['Relecture finale non faite : truncated'],
        details: { failedBatches: 1 },
      },
    });
  });

  it('échoue quand le quota est épuisé', async () => {
    const llm = {
      generateStructured: async () => failure({ kind: 'rate_limited' }),
    } as unknown as Pick<LlmService, 'generateStructured'>;

    const result = await reviewQuality(llm, { actions: [action] });

    expect(result).toMatchObject({
      success: false,
      error: { kind: 'rate_limited' },
    });
  });
});
