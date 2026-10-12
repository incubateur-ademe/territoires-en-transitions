const MAX_FICHE_ID = 2147483647;

const toTokens = (text: string): string[] =>
  text.trim() === '' ? [] : text.split(',').map((token) => token.trim());

const isFicheIdToken = (token: string): boolean =>
  /^\d+$/.test(token) && Number(token) >= 1 && Number(token) <= MAX_FICHE_ID;

export const isFicheIdsText = (text: string): boolean =>
  toTokens(text).every(isFicheIdToken);

export const toFicheIds = (text: string): number[] =>
  toTokens(text).map(Number);

export const toFicheIdsText = (ficheIds: readonly number[]): string =>
  ficheIds.join(', ');
