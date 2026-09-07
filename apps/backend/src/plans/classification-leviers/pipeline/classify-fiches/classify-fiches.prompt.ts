import { generatePrompt } from '@tet/backend/utils/llm/prompt-template';
import { CLASSIFICATION_PROMPT } from '../../prompts/classification.prompt';
import { LEVIERS_TEXT } from '../../prompts/leviers-text';

export type ClassificationPromptInput = {
  actions: string;
};

export const buildClassificationPrompt = ({
  actions,
}: ClassificationPromptInput): string =>
  generatePrompt(CLASSIFICATION_PROMPT, {
    leviers: LEVIERS_TEXT,
    actions,
  });
