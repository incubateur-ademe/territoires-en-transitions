import { LlmError } from '@tet/backend/utils/llm/llm.errors';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { generatePrompt } from '@tet/backend/utils/llm/prompt-template';
import { Result, success } from '@tet/backend/utils/result.type';
import { OCR_PROMPT } from '../../prompts/ocr.prompt';
import { PageImage } from './render-page-image';

// Une page dense fait 1 500 à 2 500 tokens de texte.
const OCR_MAX_OUTPUT_TOKENS = 6_000;

export type OcrPageFn = (
  image: PageImage,
  signal?: AbortSignal
) => Promise<Result<string, LlmError>>;

/** Transcription d'une page par le palier OCR ; rien si le fournisseur n'en a pas. */
export const buildLlmOcrPage = (
  llm: Pick<LlmService, 'generateText' | 'capabilities'>
): OcrPageFn | undefined => {
  if (!llm.capabilities.ocr) {
    return undefined;
  }
  return async (image, signal) => {
    const result = await llm.generateText({
      tier: 'ocr',
      prompt: generatePrompt(OCR_PROMPT, {}),
      images: [
        { mimeType: image.mimeType, base64: image.data.toString('base64') },
      ],
      temperature: 0,
      maxOutputTokens: OCR_MAX_OUTPUT_TOKENS,
      signal,
    });
    return result.success ? success(result.data.text) : result;
  };
};
