import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { FicheToClassify } from '../pipeline/classify-fiche/render-fiche-text';
import { ClassifyFicheService } from './classify-fiche.service';

const fiche: FicheToClassify = {
  ficheId: 1,
  titre: 'Pistes cyclables',
  description: 'Dix km',
  axePaths: [['PCAET', 'Mobilité']],
};

const toStructuredResponse = () =>
  success({
    data: {
      leviers: [{ levier: 'velo_transport_commun', categories: [1] }],
    },
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
  const service = new ClassifyFicheService({ generateStructured } as never);

  return Object.assign(service, { generateStructured });
};

describe('ClassifyFicheService.classify', () => {
  it('borne l appel au modele par le signal recu', async () => {
    const service = toService(toStructuredResponse());
    const signal = AbortSignal.timeout(60_000);

    await service.classify({ enjeu: 'ges', fiche, signal });

    const [{ signal: forwardedSignal }] =
      service.generateStructured.mock.calls[0];

    expect(forwardedSignal).toBe(signal);
  });

  it('rend la fiche classée et les tokens qui l ont produite', async () => {
    const service = toService(toStructuredResponse());

    const result = await service.classify({ enjeu: 'ges', fiche });

    expect(result).toMatchObject({
      success: true,
      data: {
        fiche: {
          ficheId: 1,
          volets: [
            { levier: 'Vélo et transport en commun', categorie: 'amenagement' },
          ],
        },
        tokens: { cachedTokens: 4 },
      },
    });
  });

  it("refuse un enjeu que l'application ne declare pas, sans appeler le modele", async () => {
    const llm = { generateStructured: vi.fn() };
    const service = new ClassifyFicheService(llm as never);

    const result = await service.classify({
      enjeu: 'biodiversite' as never,
      fiche,
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

    const result = await service.classify({ enjeu: 'ges', fiche });

    expect(result).toEqual({
      success: false,
      error: { kind: 'rate_limited' },
    });
  });
});
