import { failure, success } from '@tet/backend/utils/result.type';
import { categorieActionEnumValues } from '@tet/domain/shared';
import { describe, expect, it, vi } from 'vitest';
import { toLevierRank } from '../prompts/levier-ranks';
import { ClassifyBatchService } from './classify-batch.service';

const fiches = [
  { ficheId: 1, titre: 'Pistes cyclables', description: 'Dix km' },
  { ficheId: 2, titre: 'Bulletin municipal', description: null },
];

const toStructuredResponse = () =>
  success({
    data: fiches.map((unused, index) => ({
      index,
      justification: 'Une justification',
      hasNoRelevantLevier: false,
      volets: [
        {
          levier: toLevierRank('Vélo et transport en commun'),
          categories: [categorieActionEnumValues.indexOf('amenagement') + 1],
        },
      ],
    })),
    tokens: {
      promptTokens: 10,
      cachedTokens: 4,
      candidatesTokens: 5,
      thoughtsTokens: 1,
      totalTokens: 16,
    },
  });

const toService = (completion: unknown) => {
  const generateStructured = vi.fn().mockResolvedValue(completion);
  const service = new ClassifyBatchService({ generateStructured } as never);

  return Object.assign(service, { generateStructured });
};

describe('ClassifyBatchService.classify', () => {
  it('borne l appel au modele par le signal recu', async () => {
    const service = toService(toStructuredResponse());
    const signal = AbortSignal.timeout(60_000);

    await service.classify({ enjeu: 'ges', fiches, signal });

    const [{ signal: forwardedSignal }] =
      service.generateStructured.mock.calls[0];

    expect(forwardedSignal).toBe(signal);
  });

  it('rend une classification par fiche du lot, et les sources qui les ont produites', async () => {
    const service = toService(toStructuredResponse());

    const result = await service.classify({ enjeu: 'ges', fiches });

    expect({
      volets: result.success
        ? result.data.classified.flatMap(({ volets }) => volets)
        : undefined,
      sources: result.success ? result.data.sources : undefined,
      cachedTokens: result.success
        ? result.data.tokens.cachedTokens
        : undefined,
    }).toEqual({
      volets: [
        { levier: 'Vélo et transport en commun', categorie: 'amenagement' },
        { levier: 'Vélo et transport en commun', categorie: 'amenagement' },
      ],
      sources: fiches,
      cachedTokens: 4,
    });
  });

  it("refuse un enjeu que l'application ne declare pas, sans appeler le modele", async () => {
    const llm = { generateStructured: vi.fn() };
    const service = new ClassifyBatchService(llm as never);

    const result = await service.classify({
      enjeu: 'biodiversite' as never,
      fiches,
    });

    expect({
      error: result.success ? undefined : result.error,
      llmCalls: llm.generateStructured.mock.calls.length,
    }).toEqual({
      error: { kind: 'unknown_enjeu', enjeu: 'biodiversite' },
      llmCalls: 0,
    });
  });

  it('remonte telle quelle une reponse que le modele n a pas pu produire', async () => {
    const service = toService(failure({ kind: 'rate_limited' }));

    const result = await service.classify({ enjeu: 'ges', fiches });

    expect(result).toEqual({
      success: false,
      error: { kind: 'rate_limited' },
    });
  });
});
