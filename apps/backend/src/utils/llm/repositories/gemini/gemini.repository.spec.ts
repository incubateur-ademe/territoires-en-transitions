import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { describe, expect, it } from 'vitest';
import { GeminiRepository } from './gemini.repository';

const buildRepository = () =>
  new GeminiRepository({
    get: (key: string) =>
      ({ GEMINI_MODEL: 'gemini-3.5-flash' }[key as 'GEMINI_MODEL']),
  } as unknown as ConfigurationService);

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
});
