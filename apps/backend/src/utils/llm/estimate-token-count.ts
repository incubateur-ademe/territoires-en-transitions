/**
 * Estimation prudente, sans tokenizer : un token vaut en moyenne quatre
 * caractères de français, on en compte 3,5 pour ne pas sous-estimer.
 */
const CHARS_PER_TOKEN = 3.5;

export const estimateTokenCount = (text: string): number =>
  Math.ceil(text.length / CHARS_PER_TOKEN);

/** Nombre de caractères qui tient, selon la même estimation, dans `tokens`. */
export const estimateCharCount = (tokens: number): number =>
  Math.floor(tokens * CHARS_PER_TOKEN);
