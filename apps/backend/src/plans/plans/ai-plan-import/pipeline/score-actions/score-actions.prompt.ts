import { SCORING_PROMPT } from '../../prompts/scoring.prompt';

export type ScoringPromptInput = {
  renderedActions: string;
  text: string;
};

export const buildScoringPrompt = ({
  renderedActions,
  text,
}: ScoringPromptInput): string =>
  SCORING_PROMPT.replaceAll('{reponse_ia}', renderedActions).replaceAll(
    '{texte_pdf_a_analyser}',
    text
  );
