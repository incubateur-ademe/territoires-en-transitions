const FRENCH_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/** "JJ/MM/AAAA" tel que les prompts le demandent → "AAAA-MM-JJ", sinon null. */
export const frenchDateToIso = (value: string): string | null => {
  const match = value.trim().match(FRENCH_DATE);
  if (!match) {
    return null;
  }
  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  return isValidIsoDate(iso) ? iso : null;
};

const isValidIsoDate = (iso: string): boolean => {
  const date = new Date(iso);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(iso);
};
