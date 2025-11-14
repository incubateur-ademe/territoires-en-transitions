import { Statut } from '@/domain/plans';
import { preset } from '@/ui';
import { SortOptions } from './list-all-fiches/data/use-list-fiches';

export const SANS_STATUT_LABEL = 'Sans statut';
/** Correspondance entre les statuts et couleurs associées */
export const statutFicheActionToColor: Record<
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

export type SortByOptions = NonNullable<SortOptions>[number] & {
  label: string;
};

export const sortByProperties: SortByOptions[] = [
  {
    label: 'Date de modification',
    field: 'modified_at',
    direction: 'desc',
  },
  {
    label: 'Date de création',
    field: 'created_at',
    direction: 'desc',
  },
  {
    label: 'Ordre alphabétique',
    field: 'titre',
    direction: 'asc',
  },
];
