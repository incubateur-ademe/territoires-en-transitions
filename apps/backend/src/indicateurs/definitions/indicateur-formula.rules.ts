export const normalizeIndicateurFormula = (
  formula: string | null | undefined
): string | null => formula?.trim().toLowerCase() || null;

export const hasIndicateurFormulaChanged = (
  previousFormula: string | null | undefined,
  nextFormula: string | null | undefined
): boolean =>
  normalizeIndicateurFormula(previousFormula) !==
  normalizeIndicateurFormula(nextFormula);
