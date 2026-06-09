import { EXTRACTION_PROMPT } from '../../prompts/extraction.prompt';
import { buildIgnoreDirective } from '../../prompts/ignore-directive';

export type ExtractionPromptInput = {
  text: string;
  precisions: string;
  disabledFields: string[];
  currentDate: string;
};

export const buildExtractionPrompt = ({
  text,
  precisions,
  disabledFields,
  currentDate,
}: ExtractionPromptInput): string =>
  buildIgnoreDirective(disabledFields) +
  EXTRACTION_PROMPT.replaceAll('{precisions}', precisions)
    .replaceAll('{texte_pdf_a_analyser}', text)
    .replaceAll('{date_du_jour}', currentDate);
