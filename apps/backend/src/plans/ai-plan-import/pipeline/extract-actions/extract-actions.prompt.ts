import { DisableableField } from '../../models/disableable-field';
import {
  EXTRACTION_PLAN_SCOPE,
  EXTRACTION_PROMPT,
} from '../../prompts/extraction.prompt';
import { SPREADSHEET_RULE } from '../../prompts/field-rules';
import { buildIgnoreDirective } from '../../prompts/ignore-directive';
import { framePlanScope } from '../../prompts/plan-framing';
import { generatePrompt } from '@tet/backend/utils/llm/prompt-template';

export type ExtractionPromptInput = {
  text: string;
  instructions: string;
  disabledFields: DisableableField[];
  currentDate: string;
  /** Un tableur : le prompt dit comment en lire les rangées. */
  spreadsheet?: boolean;
  /** Type du plan, hors PCAET : précise le cadrage du prompt. */
  planTypeLabel?: string;
};

export const buildExtractionPrompt = ({
  text,
  instructions,
  disabledFields,
  currentDate,
  spreadsheet = false,
  planTypeLabel,
}: ExtractionPromptInput): string =>
  buildIgnoreDirective(disabledFields) +
  generatePrompt(EXTRACTION_PROMPT, {
    cadrage: framePlanScope(EXTRACTION_PLAN_SCOPE, planTypeLabel),
    instructions,
    textePdfAAnalyser: text,
    dateDuJour: currentDate,
    regleTableur: spreadsheet ? `\n${SPREADSHEET_RULE}` : '',
  });
