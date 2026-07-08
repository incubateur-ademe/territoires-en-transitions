import { DisableableField } from '../../models/disableable-field';
import { CONSOLIDATION_PROMPT } from '../../prompts/consolidation.prompt';
import { buildIgnoreDirective } from '../../prompts/ignore-directive';

export type ConsolidationPromptInput = {
  renderedActionsToImprove: string;
  text: string;
  disabledFields: DisableableField[];
};

export const buildConsolidationPrompt = ({
  renderedActionsToImprove,
  text,
  disabledFields,
}: ConsolidationPromptInput): string =>
  buildIgnoreDirective(disabledFields) +
  CONSOLIDATION_PROMPT.replaceAll(
    '{actions_a_ameliorer}',
    renderedActionsToImprove
  ).replaceAll('{texte_pdf_a_analyser}', text);
