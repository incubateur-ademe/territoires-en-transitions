import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it } from 'vitest';
import { ExtractedAction } from '../../models/extracted-action';
import { reviewQuality } from './qualitative-review';

const tokens: TokenUsage = {
  promptTokens: 10,
  candidatesTokens: 4,
  thoughtsTokens: 1,
  totalTokens: 15,
};

const action: ExtractedAction = {
  axe: 'Axe 1',
  sousAxe: '1.1',
  titre: '1.1.1 Action',
  description: null,
  objectifs: null,
  structurePilote: null,
  directionServicePilote: null,
  personnePilote: null,
  budget: null,
  statut: null,
  confidence: null,
  sousActions: [],
};

describe('reviewQuality', () => {
  it("renvoie l'avis textuel et les tokens", async () => {
    const llm = {
      generateStructured: async () =>
        success({ data: { avis: 'Extraction cohérente' }, tokens }),
    } as unknown as Pick<LlmService, 'generateStructured'>;

    const result = await reviewQuality(llm, { actions: [action] });

    expect(result).toMatchObject({
      success: true,
      data: { review: 'Extraction cohérente', tokens },
    });
  });

  it("propage l'échec de l'appel LLM", async () => {
    const llm = {
      generateStructured: async () => failure({ kind: 'truncated' }),
    } as unknown as Pick<LlmService, 'generateStructured'>;

    const result = await reviewQuality(llm, { actions: [action] });

    expect(result).toMatchObject({
      success: false,
      error: { kind: 'truncated' },
    });
  });
});
