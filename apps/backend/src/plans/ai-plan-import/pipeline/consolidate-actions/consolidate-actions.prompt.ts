import { DisableableField } from '../../models/disableable-field';
import { CONSOLIDATION_PROMPT } from '../../prompts/consolidation.prompt';
import { buildIgnoreDirective } from '../../prompts/ignore-directive';
import { generatePrompt } from '../../prompts/prompt-template';

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
  generatePrompt(CONSOLIDATION_PROMPT, {
    actionsAAmeliorer: renderedActionsToImprove,
    textePdfAAnalyser: text,
  });
