import { LlmError } from '@tet/backend/utils/llm/llm.errors';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { TokenUsage } from '@tet/backend/utils/llm/token-usage';
import { Result, success } from '@tet/backend/utils/result.type';
import { randomUUID } from 'node:crypto';
import { ClassificationEnjeu } from '../classification-enjeu';
import { FicheToClassify, renderFicheText } from './render-fiche-text';
import { ClassifiedFiche, toClassifiedFiche } from './to-classified-fiche.rules';

const CLASSIFICATION_MAX_OUTPUT_TOKENS = 1024;
const CLASSIFICATION_TIMEOUT_MS = 60_000;

type ClassifyFicheInput = {
  enjeu: ClassificationEnjeu;
  fiche: FicheToClassify;
  nonce?: string;
  signal?: AbortSignal;
};

export type ClassifyFicheResult = {
  fiche: ClassifiedFiche;
  tokens: TokenUsage;
};

export const classifyFiche = async (
  llm: Pick<LlmService, 'generateStructured'>,
  { enjeu, fiche, nonce = randomUUID(), signal }: ClassifyFicheInput
): Promise<Result<ClassifyFicheResult, LlmError>> => {
  const rendered = renderFicheText(fiche, nonce);

  const completion = await llm.generateStructured({
    prompt: rendered.text,
    systemInstruction: enjeu.systemInstruction,
    schema: enjeu.responseSchema,
    maxOutputTokens: CLASSIFICATION_MAX_OUTPUT_TOKENS,
    timeoutMs: CLASSIFICATION_TIMEOUT_MS,
    signal,
  });
  if (!completion.success) {
    return completion;
  }

  return success({
    fiche: toClassifiedFiche(completion.data.data, rendered),
    tokens: completion.data.tokens,
  });
};
