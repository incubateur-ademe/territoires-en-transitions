export const MIN_REFERENCE_YEAR = 2010;

export const maxReferenceYear = (): number => new Date().getFullYear();

export type ParseReferenceYearResult =
  | { ok: true; year: number }
  | { ok: false; reason: 'invalid' | 'out-of-range' | 'duplicate' };

export const parseReferenceYear = (
  raw: string,
  {
    currentReferenceYear,
    years,
  }: {
    currentReferenceYear: number | null;
    years: readonly number[];
  }
): ParseReferenceYearResult => {
  const trimmed = raw.trim();
  if (!/^\d{4}$/.test(trimmed)) {
    return { ok: false, reason: 'invalid' };
  }
  const value = Number(trimmed);
  if (value < MIN_REFERENCE_YEAR || value > maxReferenceYear()) {
    return { ok: false, reason: 'out-of-range' };
  }
  const year = value;
  if (year !== currentReferenceYear && years.includes(year)) {
    return { ok: false, reason: 'duplicate' };
  }
  return { ok: true, year };
};
