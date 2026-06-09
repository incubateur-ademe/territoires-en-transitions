import { EXTRACTION_PROMPT } from '../../prompts/extraction.prompt';
import { buildIgnoreDirective } from '../../prompts/ignore-directive';

export type ExtractionPromptInput = {
  text: string;
  instructions: string;
  disabledFields: string[];
  currentDate: string;
};

export const buildExtractionPrompt = ({
  text,
  instructions,
  disabledFields,
  currentDate,
}: ExtractionPromptInput): string =>
  buildIgnoreDirective(disabledFields) +
  EXTRACTION_PROMPT.replaceAll('{instructions}', instructions)
    .replaceAll('{texte_pdf_a_analyser}', text)
    .replaceAll('{date_du_jour}', currentDate);
