const pad = (value: number): string => `${value}`.padStart(2, '0');

export function buildDuplicatedPlanName(
  sourceNom: string | null,
  duplicatedAt: Date
): string {
  const date = `${pad(duplicatedAt.getDate())}/${pad(
    duplicatedAt.getMonth() + 1
  )}/${duplicatedAt.getFullYear()}`;
  const heure = `${pad(duplicatedAt.getHours())}:${pad(
    duplicatedAt.getMinutes()
  )}:${pad(duplicatedAt.getSeconds())}`;
  const base = sourceNom ?? 'Plan';
  return `${base} (copie du ${date} à ${heure})`;
}
