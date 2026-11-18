import { generatePrompt } from '@tet/backend/utils/llm/prompt-template';
import { framePlanScope } from '../../prompts/plan-framing';
import {
  QUALITATIVE_REVIEW_PLAN_SCOPE,
  QUALITATIVE_REVIEW_PROMPT,
} from '../../prompts/qualitative-review.prompt';

export type QualitativeReviewPromptInput = {
  renderedActions: string;
  /** Type du plan, hors PCAET : précise le cadrage du prompt. */
  planTypeLabel?: string;
};

export const buildQualitativeReviewPrompt = ({
  renderedActions,
  planTypeLabel,
}: QualitativeReviewPromptInput): string =>
  generatePrompt(QUALITATIVE_REVIEW_PROMPT, {
    cadrage: framePlanScope(QUALITATIVE_REVIEW_PLAN_SCOPE, planTypeLabel),
    reponseIa: renderedActions,
  });
