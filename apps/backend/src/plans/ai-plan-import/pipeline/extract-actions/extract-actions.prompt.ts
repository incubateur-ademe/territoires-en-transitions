import { DisableableField } from '../../models/disableable-field';
import { EXTRACTION_PROMPT } from '../../prompts/extraction.prompt';
import { SPREADSHEET_RULE } from '../../prompts/field-rules';
import { buildIgnoreDirective } from '../../prompts/ignore-directive';
import { generatePrompt } from '@tet/backend/utils/llm/prompt-template';

export type ExtractionPromptInput = {
  text: string;
  instructions: string;
  disabledFields: DisableableField[];
  currentDate: string;
  /** Un tableur : le prompt dit comment en lire les rangées. */
  spreadsheet?: boolean;
};

export const buildExtractionPrompt = ({
  text,
  instructions,
  disabledFields,
  currentDate,
  spreadsheet = false,
}: ExtractionPromptInput): string =>
  buildIgnoreDirective(disabledFields) +
  generatePrompt(EXTRACTION_PROMPT, {
    instructions,
    textePdfAAnalyser: text,
    dateDuJour: currentDate,
    regleTableur: spreadsheet ? `\n${SPREADSHEET_RULE}` : '',
  });
