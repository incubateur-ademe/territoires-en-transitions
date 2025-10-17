import { SANS_STATUT_LABEL, Statut } from '@/domain/plans';
import { preset } from '@/ui';

/** Correspondance entre les statuts et couleurs associées */
export const statutToColor: Record<
  Statut | 'NC' | typeof SANS_STATUT_LABEL,
  string
> = {
  'À venir': preset.theme.extend.colors.primary[6],
  'En cours': preset.theme.extend.colors.info[3],
  Réalisé: preset.theme.extend.colors.success[3],
  'En pause': preset.theme.extend.colors.warning[3],
  Abandonné: preset.theme.extend.colors.grey[5],
  'A discuter': '#9351CF',
  Bloqué: preset.theme.extend.colors.new[2],
  'En retard': preset.theme.extend.colors.error[1],
  [SANS_STATUT_LABEL]: preset.theme.extend.colors.grey[4],
  NC: preset.theme.extend.colors.grey[3],
};

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
