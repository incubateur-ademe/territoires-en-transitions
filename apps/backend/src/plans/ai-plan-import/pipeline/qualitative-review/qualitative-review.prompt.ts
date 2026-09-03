import { generatePrompt } from '@tet/backend/utils/llm/prompt-template';
import { QUALITATIVE_REVIEW_PROMPT } from '../../prompts/qualitative-review.prompt';

export type QualitativeReviewPromptInput = {
  renderedActions: string;
};

export const buildQualitativeReviewPrompt = ({
  renderedActions,
}: QualitativeReviewPromptInput): string =>
  generatePrompt(QUALITATIVE_REVIEW_PROMPT, { reponseIa: renderedActions });
