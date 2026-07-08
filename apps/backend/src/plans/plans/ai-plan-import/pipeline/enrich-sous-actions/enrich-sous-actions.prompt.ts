import { DisableableField } from '../../models/disableable-field';
import { ENRICHMENT_PROMPT } from '../../prompts/enrichment.prompt';
import { buildIgnoreDirective } from '../../prompts/ignore-directive';
import { generatePrompt } from '../../prompts/prompt-template';

export type EnrichmentPromptInput = {
  renderedSousActions: string;
  text: string;
  disabledFields: DisableableField[];
};

export const buildEnrichmentPrompt = ({
  renderedSousActions,
  text,
  disabledFields,
}: EnrichmentPromptInput): string =>
  buildIgnoreDirective(disabledFields) +
  generatePrompt(ENRICHMENT_PROMPT, {
    sousActionsList: renderedSousActions,
    textePdfAAnalyser: text,
  });
