import { QUALITATIVE_REVIEW_PROMPT } from '../../prompts/qualitative-review.prompt';

export type QualitativeReviewPromptInput = {
  renderedActions: string;
};

export const buildQualitativeReviewPrompt = ({
  renderedActions,
}: QualitativeReviewPromptInput): string =>
  QUALITATIVE_REVIEW_PROMPT.replaceAll('{reponse_ia}', renderedActions);
