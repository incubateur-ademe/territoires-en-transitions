import { DisableableField } from '../../models/disableable-field';
import { EXTRACTION_PROMPT } from '../../prompts/extraction.prompt';
import { buildIgnoreDirective } from '../../prompts/ignore-directive';
import { generatePrompt } from '../../prompts/prompt-template';

export type ExtractionPromptInput = {
  text: string;
  instructions: string;
  disabledFields: DisableableField[];
  currentDate: string;
};

export const buildExtractionPrompt = ({
  text,
  instructions,
  disabledFields,
  currentDate,
}: ExtractionPromptInput): string =>
  buildIgnoreDirective(disabledFields) +
  generatePrompt(EXTRACTION_PROMPT, {
    instructions,
    textePdfAAnalyser: text,
    dateDuJour: currentDate,
  });
