import { DisableableField } from '../../models/disableable-field';
import { ENRICHMENT_PROMPT } from '../../prompts/enrichment.prompt';
import { buildIgnoreDirective } from '../../prompts/ignore-directive';

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
  ENRICHMENT_PROMPT.replaceAll(
    '{sous_actions_list}',
    renderedSousActions
  ).replaceAll('{texte_pdf_a_analyser}', text);
