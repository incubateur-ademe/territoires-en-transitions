import { ClassificationPromptInput } from './classify-fiches/classify-fiches.prompt';
import { ClassificationResponseSchema } from './classify-fiches/classify-fiches.schema';

export type ClassificationEnjeu = {
  systemInstruction: string;
  buildPrompt: (input: ClassificationPromptInput) => string;
  responseSchema: ClassificationResponseSchema;
};
