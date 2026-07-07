import { formatActionFiltersToCategories } from '@/app/referentiels/actions/format-action-filters-to-categories';
import { ListDefinitionsInputFilters } from '@tet/domain/indicateurs';
import { ListFichesRequestFilters } from '@tet/domain/plans';
import { ListActionsInput } from '@tet/domain/referentiels';
import { FilterCategory } from '@tet/ui';

export type ModuleFilters =
  | ListDefinitionsInputFilters
  | ListFichesRequestFilters
  | ListActionsInput;

export const isActionModuleFilters = (
  filters: ModuleFilters
): filters is ListActionsInput =>
  'referentielIds' in filters ||
  'actionTypes' in filters ||
  'actionIds' in filters;

export const isIndicateurModuleFilters = (
  filters: ModuleFilters
): filters is ListDefinitionsInputFilters =>
  'serviceIds' in filters ||
  'planIds' in filters ||
  'categorieNoms' in filters ||
  'estRempli' in filters ||
  'participationScore' in filters ||
  'identifiantsReferentiel' in filters ||
  'estPerso' in filters ||
  'hasOpenData' in filters ||
  'estConfidentiel' in filters ||
  'estFavori' in filters;

type ActionLookupLabels = {
  piloteIds?: (id: string | number) => string | undefined;
  serviceIds?: (id: number) => string | undefined;
};

/** Formats action-shaped module filters (mesures). Returns null when filters are not action-shaped. */
export const formatModuleFiltersToCategories = (
  filters: ModuleFilters,
  lookupLabels: ActionLookupLabels = {}
): FilterCategory[] | null => {
  if (!isActionModuleFilters(filters)) {
    return null;
  }

  return formatActionFiltersToCategories(filters, lookupLabels, {
    includeReferentielIds: true,
  });
};
