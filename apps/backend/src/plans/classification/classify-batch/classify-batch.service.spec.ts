import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { ClassifyBatchService } from './classify-batch.service';

const fiches = [
  { ficheId: 1, titre: 'Pistes cyclables', description: 'Dix km' },
  { ficheId: 2, titre: 'Bulletin municipal', description: null },
];

const toStructuredResponse = () =>
  success({
    data: fiches.map((fiche, index) => ({
      index,
      justification: 'Une justification',
      hasNoRelevantLevier: false,
      volets: [
        { levier: 'Vélo et transport en commun', categories: ['amenagement'] },
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

const toService = (completion: unknown) =>
  new ClassifyBatchService({
    generateStructured: vi.fn().mockResolvedValue(completion),
  } as never);

describe('ClassifyBatchService.classify', () => {
  it('rend une classification par fiche du lot, et les sources qui les ont produites', async () => {
    const service = toService(toStructuredResponse());

    const result = await service.classify({ enjeu: 'ges', fiches });

    expect({
      classees: result.success ? result.data.classified.length : undefined,
      sources: result.success ? result.data.sources : undefined,
      jetonsCaches: result.success
        ? result.data.tokens.cachedTokens
        : undefined,
    }).toEqual({ classees: 2, sources: fiches, jetonsCaches: 4 });
  });

  it("refuse un enjeu que l'application ne declare pas, sans appeler le modele", async () => {
    const llm = { generateStructured: vi.fn() };
    const service = new ClassifyBatchService(llm as never);

    const result = await service.classify({
      enjeu: 'biodiversite' as never,
      fiches,
    });

    expect({
      erreur: result.success ? undefined : result.error,
      appelsAuModele: llm.generateStructured.mock.calls.length,
    }).toEqual({
      erreur: { kind: 'unknown_enjeu', enjeu: 'biodiversite' },
      appelsAuModele: 0,
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
