/**
 * Renvoi un tableau d'options pour les années.
 * Par défaut de 1990 à l'année en cours.
 * @param additionalYearsFromCurrentYear - Nombre d'années supplémentaires à partir de l'année en cours
 */
export const getYearsOptions = (additionalYearsFromCurrentYear?: number) => {
  const currentYear = new Date().getFullYear();
  const startingYear = 1990;
  const finalYear =
    additionalYearsFromCurrentYear && additionalYearsFromCurrentYear > 0
      ? currentYear + additionalYearsFromCurrentYear
      : currentYear;
  const yearsOptions = Array.from(
    { length: finalYear - startingYear + 1 },
    (_, i) => i + startingYear
  )
    .reverse()
    .map((y) => ({ value: y, label: y.toString() }));

  return { yearsOptions, currentYear };
};

/**
 * Renvoie "Sans titre" si le string est undefined ou null
 * @deprecated
 */
export const generateTitle = (title?: string | null) => title || 'Sans titre';
