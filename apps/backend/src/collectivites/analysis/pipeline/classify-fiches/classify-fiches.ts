import { LlmError } from '@tet/backend/utils/llm/llm.errors';
import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { randomUUID } from 'node:crypto';
import { ClassificationEnjeu } from '../classification-enjeu';
import {
  applyClassification,
  ClassifiedFiche,
  InconsistentResponse,
} from './apply-classification';
import { FicheToClassify, renderFichesText } from './render-fiches-text';

const CLASSIFICATION_THINKING_BUDGET = 512;

export const MAX_FICHES_PER_BATCH = 50;

export type ClassifyFichesError =
  | LlmError
  | InconsistentResponse
  | { kind: 'empty_batch' }
  | { kind: 'batch_too_large'; count: number };

export type ClassifyFichesInput = {
  enjeu: ClassificationEnjeu;
  fiches: FicheToClassify[];
  nonce?: string;
  signal?: AbortSignal;
};

export type ClassifyFichesResult = {
  fiches: ClassifiedFiche[];
  tokens: TokenUsage;
};

export const classifyFiches = async (
  llm: Pick<LlmService, 'generateStructured'>,
  { enjeu, fiches, nonce = randomUUID(), signal }: ClassifyFichesInput
): Promise<Result<ClassifyFichesResult, ClassifyFichesError>> => {
  if (fiches.length === 0) {
    return failure({ kind: 'empty_batch' });
  }

  if (fiches.length > MAX_FICHES_PER_BATCH) {
    return failure({ kind: 'batch_too_large', count: fiches.length });
  }

  const { text, rendered } = renderFichesText(fiches, nonce);

  const completion = await llm.generateStructured({
    prompt: enjeu.buildPrompt({ actions: text }),
    systemInstruction: enjeu.systemInstruction,
    schema: enjeu.responseSchema,
    thinkingBudget: CLASSIFICATION_THINKING_BUDGET,
    signal,
  });
  if (!completion.success) {
    return completion;
  }

  const classifiedFiches = applyClassification(completion.data.data, rendered);
  if (!classifiedFiches.success) {
    return classifiedFiches;
  }

  return success({
    fiches: classifiedFiches.data,
    tokens: completion.data.tokens,
  });
};
