/**
 * Estimation prudente, sans tokenizer : un token vaut en moyenne quatre
 * caractères de français, on en compte 3,5 pour ne pas sous-estimer.
 */
export const estimateTokenCount = (text: string): number =>
  Math.ceil(text.length / 3.5);
