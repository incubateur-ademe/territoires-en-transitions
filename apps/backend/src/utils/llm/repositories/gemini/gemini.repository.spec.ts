import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { describe, expect, it, vi } from 'vitest';
import { GeminiRepository } from './gemini.repository';

const NINE_MINUTES_MS = 9 * 60 * 1000;

const buildRepository = () =>
  new GeminiRepository({
    get: (key: string) =>
      ({ GEMINI_MODEL: 'gemini-3.5-flash' }[key as 'GEMINI_MODEL']),
  } as unknown as ConfigurationService);

const buildRepositoryWithFakeClient = () => {
  const generateContentStream = vi.fn().mockResolvedValue(emptyStream());
  const repository = buildRepository();
  Object.assign(repository, {
    client: { models: { generateContentStream } },
  });
  return { repository, generateContentStream };
};

const emptyStream = async function* () {
  yield { text: '{}', candidates: [{ finishReason: 'STOP' }] };
};

describe('GeminiRepository', () => {
  it('lit un document entier avec un seul modèle, sans OCR', () => {
    const repository = buildRepository();

    expect(repository.capabilities).toEqual({
      ocr: false,
      strategy: 'whole-document',
    });
    expect(repository.maxInputTokensPerMinute).toBeNull();
    expect(repository.modelFor('light')).toBe('gemini-3.5-flash');
    expect(repository.maxInputTokensFor('ocr')).toBe(repository.maxInputTokens);
  });

  it('attend plus longtemps après un 429 que pour une autre erreur passagère', () => {
    expect(buildRepository().rateLimitedRetryOptions).toEqual({
      retries: 8,
      minTimeout: 5_000,
      maxTimeout: 90_000,
    });
  });

  it('refuse les images sans appeler le modèle', async () => {
    const result = await buildRepository().complete({
      prompt: 'Transcris',
      tier: 'ocr',
      images: [{ mimeType: 'image/png', base64: 'AAAA' }],
    });

    expect(result).toEqual({
      success: false,
      error: { kind: 'unsupported', feature: 'images' },
    });
  });

  it("abandonne un appel au bout du délai demandé plutôt qu'après 9 minutes", async () => {
    const { repository, generateContentStream } =
      buildRepositoryWithFakeClient();

    await repository.complete({
      prompt: 'Classe',
      tier: 'strong',
      timeoutMs: 120_000,
    });

    expect(generateContentStream).toHaveBeenLastCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          httpOptions: { timeout: 120_000 },
        }),
      })
    );
  });

  it('garde 9 minutes quand aucun délai n’est demandé', async () => {
    const { repository, generateContentStream } =
      buildRepositoryWithFakeClient();

    await repository.complete({ prompt: 'Lis', tier: 'strong' });

    expect(generateContentStream).toHaveBeenLastCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          httpOptions: { timeout: NINE_MINUTES_MS },
        }),
      })
    );
  });
});
