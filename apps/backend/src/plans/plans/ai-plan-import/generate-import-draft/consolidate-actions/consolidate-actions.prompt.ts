import { CONSOLIDATION_PROMPT } from '../../prompts/consolidation.prompt';
import { buildIgnoreDirective } from '../../prompts/ignore-directive';

export type ConsolidationPromptInput = {
  actionsToImprove: string;
  text: string;
  disabledFields: string[];
};

export const buildConsolidationPrompt = ({
  actionsToImprove,
  text,
  disabledFields,
}: ConsolidationPromptInput): string =>
  buildIgnoreDirective(disabledFields) +
  CONSOLIDATION_PROMPT.replaceAll(
    '{actions_a_ameliorer}',
    actionsToImprove
  ).replaceAll('{texte_pdf_a_analyser}', text);
