import {
  getPilotesValues,
  getReferentsValues,
} from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import { FilterCategory } from '@/ui/design-system/FilterBadges';
import { uniqBy } from 'es-toolkit/array';
import { getFilterLabel } from '../labels';
import {
  FILTRE_DATE_DE_FIN_PREVISIONNELLE_OPTIONS,
  INDICATEURS_OPTIONS,
  MESURES_LIEES_OPTIONS,
  NOTES_DE_SUIVI_OPTIONS,
} from '../options';
import {
  FilterKeys,
  FormFilters,
  isFilterKey,
  WithOrWithoutFilterKeys,
} from '../types';
import { createDateFilterLabel } from './create-date-filter-label';

const findLabelByValue = (
  options: Array<{ label: string; value: string }>,
  value: string
): string => {
  return options.find((option) => option.value === value)?.label || value;
};

/**
 * List of filter keys that are displayed as a category only in the filter badges
 */
export const CHECKBOX_FILTERS_KEYS = [
  'noPilote',
  'ameliorationContinue',
  'restreint',
  'noServicePilote',
  'noStatut',
  'noPriorite',
  'noReferent',
  'doesBelongToSeveralPlans',
  'noTag',
] as const;
export type CheckboxFilterKeys = (typeof CHECKBOX_FILTERS_KEYS)[number];
export const filtersByCheckboxProperties: Record<
  CheckboxFilterKeys,
  { onlyShowCategory: boolean; defaultValue: boolean }
> = {
  noPilote: { onlyShowCategory: true, defaultValue: false },
  ameliorationContinue: { onlyShowCategory: true, defaultValue: false },
  restreint: { onlyShowCategory: true, defaultValue: false },
  noServicePilote: { onlyShowCategory: true, defaultValue: false },
  noStatut: { onlyShowCategory: true, defaultValue: false },
  noPriorite: { onlyShowCategory: true, defaultValue: false },
  noReferent: { onlyShowCategory: true, defaultValue: false },
  doesBelongToSeveralPlans: { onlyShowCategory: true, defaultValue: false },
  noTag: { onlyShowCategory: true, defaultValue: false },
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

const WITH_OR_WITHOUT_FILTERS_OPTIONS: Record<
  WithOrWithoutFilterKeys,
  Array<{ label: string; value: string }>
> = {
  hasNoteDeSuivi: NOTES_DE_SUIVI_OPTIONS,
  hasIndicateurLies: INDICATEURS_OPTIONS,
  hasMesuresLiees: MESURES_LIEES_OPTIONS,
  hasDateDeFinPrevisionnelle: FILTRE_DATE_DE_FIN_PREVISIONNELLE_OPTIONS,
} as const;

const PILOTE_KEYS: FilterKeys[] = ['utilisateurPiloteIds', 'personnePiloteIds'];
const REFERENT_KEYS: FilterKeys[] = [
  'utilisateurReferentIds',
  'personneReferenteIds',
];

const isWithOrWithoutOptionFilter = (
  key: FilterKeys
): key is WithOrWithoutFilterKeys => key in WITH_OR_WITHOUT_FILTERS_OPTIONS;
const isCheckboxFilter = (key: FilterKeys): key is CheckboxFilterKeys =>
  key in filtersByCheckboxProperties;
const isPiloteFilter = (key: FilterKeys): boolean => PILOTE_KEYS.includes(key);
const isReferentFilter = (key: FilterKeys): boolean =>
  REFERENT_KEYS.includes(key);

const createBooleanFilterCategory = (
  key: WithOrWithoutFilterKeys,
  value: any
): FilterCategory<FilterKeys> => {
  const options = WITH_OR_WITHOUT_FILTERS_OPTIONS[key] ?? [];
  const filterValueLabels = [findLabelByValue(options, value as string)];

  return {
    key,
    title: getFilterLabel(key),
    selectedFilters: filterValueLabels,
    onlyShowCategory:
      filtersByCheckboxProperties[key as CheckboxFilterKeys]
        ?.onlyShowCategory ?? false,
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

const createCustomTagFilterCategory = (
  filters: FormFilters,
  getFilterValuesLabels: (key: FilterKeys, values: any[]) => string[]
): FilterCategory<FilterKeys> => {
  return {
    key: 'libreTagsIds',
    title: getFilterLabel('libreTagsIds'),
    selectedFilters: getFilterValuesLabels(
      'libreTagsIds',
      filters.libreTagsIds ?? []
    ),
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
    selectedFilters: getFilterValuesLabels('utilisateurReferentIds', referents),
    onlyShowCategory: false,
  };
};

const createDefaultFilterCategory = (
  key: FilterKeys,
  value: any,
  getFilterValuesLabels: (key: FilterKeys, values: any[]) => string[]
): FilterCategory<FilterKeys> | null => {
  /**
   * Allow to remove filters that are equal to their default value (when a checkbox is not checked by default)
   */
  if (
    isCheckboxFilter(key) &&
    value === filtersByCheckboxProperties[key].defaultValue
  ) {
    return null;
  }

  const filterValueLabels = getFilterValuesLabels(
    key,
    Array.isArray(value) ? value : []
  );

  return {
    key,
    title: getFilterLabel(key),
    selectedFilters: filterValueLabels,
    onlyShowCategory:
      filtersByCheckboxProperties[key as CheckboxFilterKeys]
        ?.onlyShowCategory ?? false,
  };
};

const processFilterEntry = (
  [key, value]: [string, any],
  filters: FormFilters,
  getFilterValuesLabels: (key: FilterKeys, values: any[]) => string[]
): FilterCategory<FilterKeys> | null => {
  if (isFilterKey(key) === false) {
    return null;
  }
  /**
   * noPlan filter is not displayed in the filter badges since it's visible at page level
   * between "toutes les fiches", "fiches des plans" and "fiches non classées" pages
   */
  if (key === 'noPlan') {
    return null;
  }
  if (isWithOrWithoutOptionFilter(key)) {
    return createBooleanFilterCategory(key, value);
  }

  if (isPiloteFilter(key)) {
    return createPiloteFilterCategory(filters, getFilterValuesLabels);
  }

  if (isReferentFilter(key)) {
    return createReferentFilterCategory(filters, getFilterValuesLabels);
  }
  if (key === 'libreTagsIds') {
    return createCustomTagFilterCategory(filters, getFilterValuesLabels);
  }
  return createDefaultFilterCategory(key, value, getFilterValuesLabels);
};

export const formatToPrintableFilters = (
  filters: FormFilters,
  getFilterValuesLabels: (key: FilterKeys, values: any[]) => string[]
): FilterCategory<FilterKeys>[] => {
  const { dateFilterCategory, remainingFilters } =
    createDateFilterContent(filters);

  const filterCategories: FilterCategory<FilterKeys>[] = Object.entries(
    remainingFilters
  )
    .filter(([, value]) => value !== undefined)
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

  return formattedFilterCategories;
};
