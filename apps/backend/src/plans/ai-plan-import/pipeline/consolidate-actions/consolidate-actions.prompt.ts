import { DisableableField } from '../../models/disableable-field';
import { CONSOLIDATION_PROMPT } from '../../prompts/consolidation.prompt';
import { EXTRACTION_PLAN_SCOPE } from '../../prompts/extraction.prompt';
import { buildIgnoreDirective } from '../../prompts/ignore-directive';
import { framePlanScope } from '../../prompts/plan-framing';
import { generatePrompt } from '@tet/backend/utils/llm/prompt-template';

export type ConsolidationPromptInput = {
  renderedActionsToImprove: string;
  text: string;
  disabledFields: DisableableField[];
  /** Type du plan, hors PCAET : précise le cadrage du prompt. */
  planTypeLabel?: string;
};

export const buildConsolidationPrompt = ({
  renderedActionsToImprove,
  text,
  disabledFields,
  planTypeLabel,
}: ConsolidationPromptInput): string =>
  buildIgnoreDirective(disabledFields) +
  generatePrompt(CONSOLIDATION_PROMPT, {
    cadrage: framePlanScope(EXTRACTION_PLAN_SCOPE, planTypeLabel),
    actionsAAmeliorer: renderedActionsToImprove,
    textePdfAAnalyser: text,
  });
