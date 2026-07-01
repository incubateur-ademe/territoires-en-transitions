export const parseCellNumber = (raw: string): number | null => {
  const normalized = raw.replace(/\s/g, '').replaceAll(',', '.');
  if (normalized === '') {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
};
