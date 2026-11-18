import { DisableableField } from '../../models/disableable-field';
import { ENRICHMENT_PROMPT } from '../../prompts/enrichment.prompt';
import { EXTRACTION_PLAN_SCOPE } from '../../prompts/extraction.prompt';
import { buildIgnoreDirective } from '../../prompts/ignore-directive';
import { framePlanScope } from '../../prompts/plan-framing';
import { generatePrompt } from '@tet/backend/utils/llm/prompt-template';

export type EnrichmentPromptInput = {
  renderedSousActions: string;
  text: string;
  disabledFields: DisableableField[];
  /** Type du plan, hors PCAET : précise le cadrage du prompt. */
  planTypeLabel?: string;
};

export const buildEnrichmentPrompt = ({
  renderedSousActions,
  text,
  disabledFields,
  planTypeLabel,
}: EnrichmentPromptInput): string =>
  buildIgnoreDirective(disabledFields) +
  generatePrompt(ENRICHMENT_PROMPT, {
    cadrage: framePlanScope(EXTRACTION_PLAN_SCOPE, planTypeLabel),
    sousActionsList: renderedSousActions,
    textePdfAAnalyser: text,
  });
