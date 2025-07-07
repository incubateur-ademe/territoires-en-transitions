import { FilterCategory, FilterBadges as UIFilterBadges } from '@/ui';

import { filterKeysToIgnore } from './filters/count-active-fiche-filters';
import { useFicheActionFilters } from './filters/fiche-action-filters.context';
import { getFilterLabel, typePeriodLabels } from './filters/labels';
import { type FilterKeys, type Filters } from './filters/types';
import {
  INDICATEUR_OPTIONS,
  MESURE_OPTIONS,
  NOTE_OPTIONS,
  OPTIONS_FILTRE_DATE_DE_FIN_PREVISIONNELLE,
  OPTIONS_INDICATEURS,
  OPTIONS_MESURES_LIEES,
  OPTIONS_NOTES_DE_SUIVI,
} from './MenuFiltresToutesLesFichesAction';

const findLabelByValue = (
  options: Array<{ label: string; value: string }>,
  value: string
): string => {
  return options.find((option) => option.value === value)?.label || value;
};

const createDateFilterLabel = (filters: Filters): string | null => {
  if (!filters.typePeriode || (!filters.debutPeriode && !filters.finPeriode)) {
    return null;
  }

  const typePeriodeLabel =
    typePeriodLabels[filters.typePeriode as keyof typeof typePeriodLabels] ??
    typePeriodLabels.creation;
  let title = `Date ${typePeriodeLabel}`;

  if (filters.debutPeriode && filters.finPeriode) {
    return `${title} entre le ${new Date(
      filters.debutPeriode
    ).toLocaleDateString()} et le ${new Date(
      filters.finPeriode
    ).toLocaleDateString()}`;
  }

  if (filters.debutPeriode) {
    return `${title} à partir du ${new Date(
      filters.debutPeriode
    ).toLocaleDateString()}`;
  }

  if (filters.finPeriode) {
    return `${title} allant jusqu'au ${new Date(
      filters.finPeriode
    ).toLocaleDateString()}`;
  }

  return title;
};

/**
 * List of filter keys that are displayed as a category only in the filter badges
 */
const filterKeyCategoryVisibility: Partial<Record<FilterKeys, boolean>> = {
  texteNomOuDescription: true,
  noPilote: true,
  hasBudgetPrevisionnel: true,
  ameliorationContinue: true,
  restreint: true,
  noServicePilote: true,
  noStatut: true,
  noPriorite: true,
  noReferent: true,
  doesBelongToSeveralPlans: true,
  noTag: true,
};

const createDateFilterContent = (
  filters: Filters
): {
  dateFilterCategory: FilterCategory<FilterKeys> | null;
  remainingFilters: Filters;
} => {
  const dateFilterLabel = createDateFilterLabel(filters);
  if (!dateFilterLabel) {
    return { dateFilterCategory: null, remainingFilters: filters };
  }

  const periodRelatedKeys: FilterKeys[] = [
    'typePeriode',
    'debutPeriode',
    'finPeriode',
  ];

  // Create a new filters object without the date-related keys
  const remainingFilters = { ...filters };
  periodRelatedKeys.forEach((key) => {
    delete remainingFilters[key];
  });

  return {
    dateFilterCategory: {
      key: periodRelatedKeys,
      title: dateFilterLabel,
      selectedFilters: [],
      onlyShowCategory: true,
    },
    remainingFilters,
  };
};

export const FilterBadges = () => {
  const {
    filters,
    resetFilters,
    onDeleteFilterValue,
    onDeleteFilterCategory,
    getFilterValuesLabels,
  } = useFicheActionFilters();

  const { dateFilterCategory, remainingFilters } =
    createDateFilterContent(filters);
  console.log({ remainingFilters });
  const filterCategories: FilterCategory<FilterKeys>[] = Object.entries(
    remainingFilters
  )
    .filter(([key, value]) => {
      if (filterKeysToIgnore.includes(key as FilterKeys)) {
        return false;
      }
      return value !== undefined;
    })
    .map(([key, value]) => {
      const currentKey: FilterKeys = key as FilterKeys;

      // Handle boolean filters like hasNoteDeSuivi
      let filterValueLabels: string[] = [];
      if (typeof value === 'boolean') {
        // For boolean filters, create appropriate labels using existing options
        if (currentKey === 'hasNoteDeSuivi') {
          const optionValue = value ? NOTE_OPTIONS.WITH : NOTE_OPTIONS.WITHOUT;
          filterValueLabels = [
            findLabelByValue(OPTIONS_NOTES_DE_SUIVI, optionValue),
          ];
        } else if (currentKey === 'hasIndicateurLies') {
          const optionValue = value
            ? INDICATEUR_OPTIONS.WITH
            : INDICATEUR_OPTIONS.WITHOUT;
          filterValueLabels = [
            findLabelByValue(OPTIONS_INDICATEURS, optionValue),
          ];
        } else if (currentKey === 'hasMesuresLiees') {
          const optionValue = value
            ? MESURE_OPTIONS.WITH
            : MESURE_OPTIONS.WITHOUT;
          filterValueLabels = [
            findLabelByValue(OPTIONS_MESURES_LIEES, optionValue),
          ];
        } else if (currentKey === 'hasDateDeFinPrevisionnelle') {
          const optionValue = value ? 'Date renseignée' : 'Date non renseignée';
          filterValueLabels = [
            findLabelByValue(
              OPTIONS_FILTRE_DATE_DE_FIN_PREVISIONNELLE,
              optionValue
            ),
          ];
        } else {
          // For other boolean filters, use the generic approach
          filterValueLabels = getFilterValuesLabels(currentKey, [
            value.toString(),
          ]);
        }
      } else {
        // For array filters, use the existing logic
        filterValueLabels = getFilterValuesLabels(
          currentKey,
          Array.isArray(value) ? value : []
        );
      }

      return {
        key: key as FilterKeys,
        title: getFilterLabel(currentKey),
        selectedFilters: filterValueLabels,
        onlyShowCategory: filterKeyCategoryVisibility[currentKey],
      };
    });

  const formattedFilterCategories = dateFilterCategory
    ? [...filterCategories, dateFilterCategory]
    : filterCategories;
  return (
    <UIFilterBadges
      filterCategories={formattedFilterCategories}
      onDeleteFilterValue={onDeleteFilterValue}
      onDeleteFilterCategory={onDeleteFilterCategory}
      onClearAllFilters={resetFilters}
    />
  );
};
