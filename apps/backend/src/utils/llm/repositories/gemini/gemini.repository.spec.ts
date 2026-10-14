import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { FinishReason, ThinkingLevel } from '@google/genai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GeminiRepository } from './gemini.repository';

const NINE_MINUTES_MS = 9 * 60 * 1000;

const generateContentStream = vi.hoisted(() => vi.fn());

vi.mock('@google/genai', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@google/genai')>()),
  GoogleGenAI: class {
    models = { generateContentStream };
  },
}));

const buildRepository = () =>
  new GeminiRepository({
    get: (key: string) =>
      (
        ({
          GEMINI_MODEL: 'gemini-3.5-flash',
          GOOGLE_API_KEY: 'fake-key',
        }) as Record<string, string>
      )[key],
  } as unknown as ConfigurationService);

async function* completedStream() {
  yield {
    text: '{}',
    candidates: [{ finishReason: FinishReason.STOP }],
    usageMetadata: { promptTokenCount: 1, totalTokenCount: 2 },
  };
}

const sentThinkingConfig = () =>
  generateContentStream.mock.calls[0][0].config.thinkingConfig;

describe('GeminiRepository', () => {
  beforeEach(() => {
    generateContentStream.mockReset();
    generateContentStream.mockImplementation(async () => completedStream());
  });

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
    expect(generateContentStream).not.toHaveBeenCalled();
  });

  it("envoie un niveau de réflexion, sans budget, quand l'effort est demandé", async () => {
    const result = await buildRepository().complete({
      prompt: 'p',
      tier: 'strong',
      thinkingBudget: 8192,
      reasoningEffort: 'low',
    });

    expect(result.success).toBe(true);
    expect(sentThinkingConfig()).toEqual({ thinkingLevel: ThinkingLevel.LOW });
  });

  it("garde le budget de réflexion quand aucun effort n'est demandé", async () => {
    await buildRepository().complete({
      prompt: 'p',
      tier: 'strong',
      thinkingBudget: 8192,
    });

    expect(sentThinkingConfig()).toEqual({ thinkingBudget: 8192 });
  });

  it("abandonne un appel au bout du délai demandé plutôt qu'après 9 minutes", async () => {
    await buildRepository().complete({
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
    await buildRepository().complete({ prompt: 'Lis', tier: 'strong' });

    expect(generateContentStream).toHaveBeenLastCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          httpOptions: { timeout: NINE_MINUTES_MS },
        }),
      })
    );
  });
});
