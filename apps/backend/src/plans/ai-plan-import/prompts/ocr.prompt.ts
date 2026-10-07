import { definePrompt } from '@tet/backend/utils/llm/prompt-template';

export const OCR_PROMPT = definePrompt({
  template: `Transcris intégralement le texte de cette page en Markdown.
Conserve l'ordre de lecture, mets chaque titre sur sa propre ligne, et rends les tableaux ligne par ligne, cellules séparées par " | ".
Ne commente pas, ne résume pas, n'invente rien : seulement le texte de la page.`,
  placeholders: {},
});
