import { FilterCategory, FilterBadges as UIFilterBadges } from '@/ui';

import {
  getPilotesValues,
  getReferentsValues,
} from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import uniqBy from 'lodash/uniqBy';
import { filterKeysToIgnore } from './filters/count-active-fiche-filters';
import { useFicheActionFilters } from './filters/fiche-action-filters.context';
import { getFilterLabel, typePeriodLabels } from './filters/labels';
import {
  FILTRE_DATE_DE_FIN_PREVISIONNELLE_OPTIONS,
  INDICATEURS_OPTIONS,
  MESURES_LIEES_OPTIONS,
  NOTES_DE_SUIVI_OPTIONS,
} from './filters/options';
import { FormFilters, type FilterKeys } from './filters/types';

const findLabelByValue = (
  options: Array<{ label: string; value: string }>,
  value: string
): string => {
  return options.find((option) => option.value === value)?.label || value;
};

const createDateFilterLabel = (filters: FormFilters): string | null => {
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
  filters: FormFilters
): {
  dateFilterCategory: FilterCategory<FilterKeys> | null;
  remainingFilters: FormFilters;
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

      if (currentKey === 'hasNoteDeSuivi') {
        filterValueLabels = [
          findLabelByValue(NOTES_DE_SUIVI_OPTIONS, value as string),
        ];
      } else if (currentKey === 'hasIndicateurLies') {
        filterValueLabels = [
          findLabelByValue(INDICATEURS_OPTIONS, value as string),
        ];
      } else if (currentKey === 'hasMesuresLiees') {
        filterValueLabels = [
          findLabelByValue(MESURES_LIEES_OPTIONS, value as string),
        ];
      } else if (currentKey === 'hasDateDeFinPrevisionnelle') {
        filterValueLabels = [
          findLabelByValue(
            FILTRE_DATE_DE_FIN_PREVISIONNELLE_OPTIONS,
            value as string
          ),
        ];
      } else if (
        currentKey === 'utilisateurPiloteIds' ||
        currentKey === 'personnePiloteIds'
      ) {
        const pilotes = getPilotesValues(filters);
        return {
          key: ['utilisateurPiloteIds', 'personnePiloteIds'] as FilterKeys[],
          title: getFilterLabel(currentKey),
          selectedFilters: getFilterValuesLabels(currentKey, pilotes),
          onlyShowCategory: false,
        };
      } else if (
        currentKey === 'utilisateurReferentIds' ||
        currentKey === 'personneReferenteIds'
      ) {
        const referents = getReferentsValues(filters);
        return {
          key: [
            'utilisateurReferentIds',
            'personneReferenteIds',
          ] as FilterKeys[],
          title: getFilterLabel(currentKey),
          selectedFilters: getFilterValuesLabels(currentKey, referents),
          onlyShowCategory: false,
        };
      } else {
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

  const uniqFilterCategories = uniqBy(filterCategories, (obj) =>
    Array.isArray(obj.key) ? obj.key.join('|') : obj.key.toString()
  );

  const formattedFilterCategories = dateFilterCategory
    ? [...uniqFilterCategories, dateFilterCategory]
    : uniqFilterCategories;

  return (
    <UIFilterBadges
      filterCategories={formattedFilterCategories}
      onDeleteFilterValue={onDeleteFilterValue}
      onDeleteFilterCategory={onDeleteFilterCategory}
      onClearAllFilters={resetFilters}
    />
  );
};
