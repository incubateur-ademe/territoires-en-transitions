import { FilterCategory, FilterBadges as UIFilterBadges } from '@/ui';

import {
  getPilotesValues,
  getReferentsValues,
} from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import uniqBy from 'lodash/uniqBy';
import { filterKeysToIgnore } from '../filters/count-active-fiche-filters';
import { useFicheActionFilters } from '../filters/fiche-action-filters-context';
import { getFilterLabel, typePeriodLabels } from '../filters/labels';
import {
  FILTRE_DATE_DE_FIN_PREVISIONNELLE_OPTIONS,
  INDICATEURS_OPTIONS,
  MESURES_LIEES_OPTIONS,
  NOTES_DE_SUIVI_OPTIONS,
} from '../filters/options';
import { FormFilters, type FilterKeys } from '../filters/types';

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

const periodRelatedKeys: FilterKeys[] = [
  'typePeriode',
  'debutPeriode',
  'finPeriode',
];
const createDateFilterContent = (
  filters: FormFilters
): {
  dateFilterCategory: FilterCategory<FilterKeys> | null;
  remainingFilters: FormFilters;
} => {
  const dateFilterLabel = createDateFilterLabel(filters);
  const remainingFilters = { ...filters };
  // Create a new filters object without the date-related keys
  periodRelatedKeys.forEach((key) => {
    delete remainingFilters[key];
  });
  if (!dateFilterLabel) {
    return { dateFilterCategory: null, remainingFilters };
  }

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

  const BOOLEAN_FILTER_OPTIONS: Partial<
    Record<FilterKeys, Array<{ label: string; value: string }>>
  > = {
    hasNoteDeSuivi: NOTES_DE_SUIVI_OPTIONS,
    hasIndicateurLies: INDICATEURS_OPTIONS,
    hasMesuresLiees: MESURES_LIEES_OPTIONS,
    hasDateDeFinPrevisionnelle: FILTRE_DATE_DE_FIN_PREVISIONNELLE_OPTIONS,
  };

  const PILOTE_KEYS: FilterKeys[] = [
    'utilisateurPiloteIds',
    'personnePiloteIds',
  ];
  const REFERENT_KEYS: FilterKeys[] = [
    'utilisateurReferentIds',
    'personneReferenteIds',
  ];

  const isValidFilterEntry = ([key, value]: [string, any]): boolean =>
    !filterKeysToIgnore.includes(key as FilterKeys) && value !== undefined;

  const isBooleanFilter = (key: FilterKeys): boolean =>
    key in BOOLEAN_FILTER_OPTIONS;
  const isPiloteFilter = (key: FilterKeys): boolean =>
    PILOTE_KEYS.includes(key);
  const isReferentFilter = (key: FilterKeys): boolean =>
    REFERENT_KEYS.includes(key);

  const createBooleanFilterCategory = (
    key: FilterKeys,
    value: any
  ): FilterCategory<FilterKeys> => {
    const options = BOOLEAN_FILTER_OPTIONS[key] ?? [];
    const filterValueLabels = [findLabelByValue(options, value as string)];

    return {
      key,
      title: getFilterLabel(key),
      selectedFilters: filterValueLabels,
      onlyShowCategory: filterKeyCategoryVisibility[key],
    };
  };

  const createPiloteFilterCategory = (
    filters: FormFilters,
    getFilterValuesLabels: (key: FilterKeys, values: any[]) => string[]
  ): FilterCategory<FilterKeys> => {
    const pilotes = getPilotesValues(filters);

    return {
      key: PILOTE_KEYS,
      title: getFilterLabel('utilisateurPiloteIds'),
      selectedFilters: getFilterValuesLabels('utilisateurPiloteIds', pilotes),
      onlyShowCategory: false,
    };
  };

  const createReferentFilterCategory = (
    filters: FormFilters,
    getFilterValuesLabels: (key: FilterKeys, values: any[]) => string[]
  ): FilterCategory<FilterKeys> => {
    const referents = getReferentsValues(filters);

    return {
      key: REFERENT_KEYS,
      title: getFilterLabel('utilisateurReferentIds'),
      selectedFilters: getFilterValuesLabels(
        'utilisateurReferentIds',
        referents
      ),
      onlyShowCategory: false,
    };
  };

  const createDefaultFilterCategory = (
    key: FilterKeys,
    value: any,
    getFilterValuesLabels: (key: FilterKeys, values: any[]) => string[]
  ): FilterCategory<FilterKeys> => {
    const filterValueLabels = getFilterValuesLabels(
      key,
      Array.isArray(value) ? value : []
    );

    return {
      key,
      title: getFilterLabel(key),
      selectedFilters: filterValueLabels,
      onlyShowCategory: filterKeyCategoryVisibility[key],
    };
  };

  const processFilterEntry = (
    [key, value]: [string, any],
    filters: FormFilters,
    getFilterValuesLabels: (key: FilterKeys, values: any[]) => string[]
  ): FilterCategory<FilterKeys> | null => {
    const currentKey = key as FilterKeys;

    if (isBooleanFilter(currentKey)) {
      return createBooleanFilterCategory(currentKey, value);
    }

    if (isPiloteFilter(currentKey)) {
      return createPiloteFilterCategory(filters, getFilterValuesLabels);
    }

    if (isReferentFilter(currentKey)) {
      return createReferentFilterCategory(filters, getFilterValuesLabels);
    }

    return createDefaultFilterCategory(
      currentKey,
      value,
      getFilterValuesLabels
    );
  };

  const filterCategories: FilterCategory<FilterKeys>[] = Object.entries(
    remainingFilters
  )
    .filter(isValidFilterEntry)
    .map((entry) => processFilterEntry(entry, filters, getFilterValuesLabels))
    .filter(
      (category): category is FilterCategory<FilterKeys> => category !== null
    );
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
