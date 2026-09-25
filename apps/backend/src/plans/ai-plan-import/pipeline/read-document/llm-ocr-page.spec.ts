import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { buildLlmOcrPage } from './llm-ocr-page';

const tokens = {
  promptTokens: 1,
  cachedTokens: 0,
  candidatesTokens: 1,
  thoughtsTokens: 0,
  totalTokens: 2,
};

describe('buildLlmOcrPage', () => {
  it("ne rend rien quand le fournisseur n'a pas d'OCR", () => {
    const llm = {
      capabilities: { ocr: false, strategy: 'whole-document' },
      generateText: vi.fn(),
    } as unknown as LlmService;

    expect(buildLlmOcrPage(llm)).toBeUndefined();
  });

  it("envoie l'image au palier OCR et rend le texte", async () => {
    const generateText = vi.fn(async () =>
      success({ text: '# Page scannée', tokens })
    );
    const llm = {
      capabilities: { ocr: true, strategy: 'segmented' },
      generateText,
    } as unknown as LlmService;

    const ocrPage = buildLlmOcrPage(llm);
    const result = await ocrPage?.({
      pageIndex: 3,
      mimeType: 'image/jpeg',
      data: Buffer.from('jpeg'),
      width: 10,
      height: 10,
    });

    expect(result).toEqual(success('# Page scannée'));
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        tier: 'ocr',
        temperature: 0,
        images: [
          {
            mimeType: 'image/jpeg',
            base64: Buffer.from('jpeg').toString('base64'),
          },
        ],
      })
    );
  });
});
