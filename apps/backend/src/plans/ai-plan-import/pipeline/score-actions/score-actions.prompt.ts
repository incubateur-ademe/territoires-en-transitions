import { generatePrompt } from '@tet/backend/utils/llm/prompt-template';
import { SCORING_PROMPT } from '../../prompts/scoring.prompt';

export type ScoringPromptInput = {
  renderedActions: string;
  text: string;
};

export const buildScoringPrompt = ({
  renderedActions,
  text,
}: ScoringPromptInput): string =>
  generatePrompt(SCORING_PROMPT, {
    reponseIa: renderedActions,
    textePdfAAnalyser: text,
  });
