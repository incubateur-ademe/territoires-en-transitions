import { makeCollectiviteToutesLesFichesUrl } from '@/app/app/paths';
import { searchParametersParser } from '@/app/plans/fiches/list-all-fiches/filters/filter-converter';
import { nameToparams } from '@/app/plans/fiches/list-all-fiches/filters/filters-search-parameters-mapper';
import {
  FilterKeys,
  WITH,
  WITHOUT,
} from '@/app/plans/fiches/list-all-fiches/filters/types';
import {
  CountByPropertyEnumType,
  ListFichesRequestFilters as Filters,
} from '@tet/domain/plans';
import { isNil } from 'es-toolkit';
import {
  generalCountByToFilterKeyMapping,
  noValueCountByToFilterKeyMapping,
} from './filter-keys';

/**
 * Si la valeur est null ou undefined, on renvoie la propriété de l'objet
 * qui est l'inverse de la propriété du countByProperty
 *
 * Exemple:
 * - countByProperty: 'pilotes' and value is null
 * - return: { noPilote: true }
 *
 * - countByProperty: 'pilotes' and value is [1, 2]
 * - return: { personnePiloteIds: [1, 2] }
 *
 * @param key - La propriété du countByProperty
 * @param value - La valeur de la propriété du countByProperty
 * @returns L'objet avec la propriété et la valeur
 */
function getFilterPropertyOrItsNegationWhenNull(
  key: CountByPropertyEnumType,
  value: string | number | null | boolean
): Partial<Record<FilterKeys, boolean>> | null {
  const filterKey =
    noValueCountByToFilterKeyMapping[
      key as keyof typeof noValueCountByToFilterKeyMapping
    ];
  if (filterKey && isNil(value)) {
    return { [filterKey]: true };
  }

  return null;
}

const getValueFromKey = (
  key: FilterKeys,
  value: string | number | null | boolean
) => {
  const parser = searchParametersParser[key];
  const isArrayParser = (parser as any)?.isArrayParser;
  const isWithOrWithoutArrayParser = (parser as any)
    ?.isWithOrWithoutArrayParser;

  if (isArrayParser) {
    return [value];
  }
  if (isWithOrWithoutArrayParser) {
    return value === true ? WITH : value === false ? WITHOUT : value;
  }
  return value;
};

const getCorrectKeyAndValue = (
  countByPropertyKey: CountByPropertyEnumType,
  value: string | number | null | boolean
): Partial<Record<FilterKeys, any>> | null => {
  if (value === null) {
    return null;
  }
  const actualKey = getFilterKeyFromCountByPropertyKey(
    countByPropertyKey,
    value
  );
  if (actualKey === null) {
    return null;
  }

  return {
    [actualKey]: getValueFromKey(actualKey, value),
  };
};
//@TODO: add testing here to check behavior
const getFilterKeyFromCountByPropertyKey = (
  key: CountByPropertyEnumType,
  value: string | number | boolean
): FilterKeys | null => {
  const filterKey =
    generalCountByToFilterKeyMapping[
      key as keyof typeof generalCountByToFilterKeyMapping
    ];

  if (filterKey) {
    return filterKey;
  }

  if (key === 'pilotes') {
    return typeof value === 'number'
      ? 'personnePiloteIds'
      : 'utilisateurPiloteIds';
  }
  if (key === 'referents') {
    return typeof value === 'number'
      ? 'personneReferenteIds'
      : 'utilisateurReferentIds';
  }
  return null;
};

const generateSearchParams = (
  filters: Filters,
  countByProperty: CountByPropertyEnumType,
  propertyValue: any
): string | null => {
  const searchParams = new URLSearchParams();

  // TODO: to be unit tested
  const countByPropertyFilter =
    getFilterPropertyOrItsNegationWhenNull(countByProperty, propertyValue) ||
    getCorrectKeyAndValue(countByProperty, propertyValue);
  if (!countByPropertyFilter) {
    return null;
  }

  const allFilters = {
    ...filters,
    ...countByPropertyFilter,
  };
  Object.entries(allFilters).forEach(([key, value]) => {
    const paramKey = nameToparams[key as FilterKeys];
    const parser = searchParametersParser[key as FilterKeys];
    if (paramKey === undefined || isNil(value)) {
      return;
    }
    const serialized = parser.serialize?.(value);
    if (typeof serialized !== 'string' || serialized === '') {
      return;
    }
    searchParams.set(paramKey, serialized);
  });

  return searchParams.toString();
};

/** Permet de transformer les filtres de modules fiches action en paramètres d'URL */
export const makeFichesActionUrlWithParams = (
  collectiviteId: number,
  filtres: Filters,
  countByProperty: CountByPropertyEnumType,
  propertyValue: string | number | null | boolean
): string | null => {
  const baseUrl = makeCollectiviteToutesLesFichesUrl({ collectiviteId });
  const searchParams = generateSearchParams(
    filtres,
    countByProperty,
    propertyValue
  );
  if (!searchParams) {
    return null;
  }

  return `${baseUrl}?${searchParams}`;
};
