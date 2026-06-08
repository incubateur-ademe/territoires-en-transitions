import { EXTRACTION_PROMPT } from '../../prompts/extraction.prompt';

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

const buildIgnoreDirective = (disabledFields: string[]): string => {
  if (disabledFields.length === 0) {
    return '';
  }
  const lines = disabledFields.map((field) => `- "${field}"`).join('\n');
  return (
    '================================================================\n' +
    'INSTRUCTION PRIORITAIRE — COLONNES / CHAMPS À IGNORER\n' +
    'Les colonnes/champs suivants NE doivent PAS être remplis :\n' +
    `${lines}\n` +
    'Pour chacun de ces champs, retournez systématiquement la valeur ' +
    'vide ("" pour les chaînes, [] pour les listes, "" pour les nombres).\n' +
    'Si les règles, exemples ou précisions ci-dessous décrivent comment ' +
    'remplir ces champs, IGNOREZ ces instructions : ne remplissez que ' +
    'les autres champs. Cette consigne est PRIORITAIRE sur tout le reste.\n' +
    '================================================================\n\n'
  );
};
