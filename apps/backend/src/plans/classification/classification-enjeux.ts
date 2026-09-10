import { Enjeu } from '@tet/domain/shared';
import { ClassificationEnjeu } from './pipeline/classification-enjeu';
import { buildClassificationPrompt } from './pipeline/classify-fiches/classify-fiches.prompt';
import { classificationResponseSchema } from './pipeline/classify-fiches/classify-fiches.schema';
import { CLASSIFICATION_SYSTEM_INSTRUCTION } from './prompts/classification.prompt';

export const ENJEU_GES: ClassificationEnjeu = {
  systemInstruction: CLASSIFICATION_SYSTEM_INSTRUCTION,
  buildPrompt: buildClassificationPrompt,
  responseSchema: classificationResponseSchema,
};

export const DECLARED_ENJEUX = {
  ges: ENJEU_GES,
} satisfies Record<Enjeu, ClassificationEnjeu>;

export const isDeclaredEnjeu = (value: string): value is Enjeu =>
  value in DECLARED_ENJEUX;
