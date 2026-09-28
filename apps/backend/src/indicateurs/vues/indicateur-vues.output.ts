import {
  indicateurVueFiltersSchema,
  normalizeIndicateurVueFilters,
  type IndicateurVueFilters,
} from '@tet/domain/indicateurs';
import { IndicateurVueRow } from './indicateur-vue.table';

export type IndicateurVue = Omit<IndicateurVueRow, 'filtres'> & {
  // Une vue invalide reste visible et supprimable sans élargir sa sélection.
  filtres: IndicateurVueFilters | null;
};

export function toIndicateurVue(row: IndicateurVueRow): IndicateurVue {
  const parsedFilters = indicateurVueFiltersSchema.safeParse(row.filtres);
  return {
    ...row,
    filtres: parsedFilters.success
      ? normalizeIndicateurVueFilters(parsedFilters.data)
      : null,
    createdAt: new Date(row.createdAt).toISOString(),
    modifiedAt: new Date(row.modifiedAt).toISOString(),
  };
}
