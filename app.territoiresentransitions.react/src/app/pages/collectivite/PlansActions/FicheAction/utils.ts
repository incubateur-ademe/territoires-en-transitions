import { Statut } from '@/domain/plans/fiches';
import { preset } from '@/ui';

export const SANS_STATUT_LABEL = 'Sans statut';

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
