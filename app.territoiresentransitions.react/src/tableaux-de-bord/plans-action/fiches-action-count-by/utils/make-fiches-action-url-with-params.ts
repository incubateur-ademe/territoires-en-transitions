import { makeCollectiviteToutesLesFichesUrl } from '@/app/app/paths';
import { searchParametersParser } from '@/app/plans/fiches/list-all-fiches/filters/filter-converter';
import { nameToparams } from '@/app/plans/fiches/list-all-fiches/filters/filters-search-parameters-mapper';
import {
  WITH,
  WITHOUT,
} from '@/app/plans/fiches/list-all-fiches/filters/options';
import { FilterKeys } from '@/app/plans/fiches/list-all-fiches/filters/types';
import {
  CountByPropertyEnumType,
  ListFichesRequestFilters as Filters,
} from '@/domain/plans/fiches';
import { isNil } from 'es-toolkit';
import { isNumber } from 'lodash';

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
): Partial<Record<FilterKeys, any>> {
  const noValueKeyMapping: Partial<
    Record<CountByPropertyEnumType, FilterKeys>
  > = {
    priorite: 'noPriorite',
    pilotes: 'noPilote',
    services: 'noServicePilote',
    referents: 'noReferent',
    libreTags: 'noTag',
    statut: 'noStatut',
  } as const;
  if (noValueKeyMapping[key] && isNil(value)) {
    return { [noValueKeyMapping[key]]: true };
  }

  return { [key]: value };
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
): Partial<Record<FilterKeys, any>> => {
  if (value === null) {
    return {};
  }
  const actualKey = getFilterKeyFromCountByPropertyKey(
    countByPropertyKey,
    value
  );
  if (actualKey === null) {
    return {};
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
  const keyMapping: Partial<Record<CountByPropertyEnumType, FilterKeys>> = {
    statut: 'statuts',
    priorite: 'priorites',
    libreTags: 'libreTagsIds',
    cibles: 'cibles',
    financeurs: 'financeurIds',
    thematiques: 'thematiqueIds',
    indicateurs: 'hasIndicateurLies',
  };

  const maybeKey = keyMapping[key];
  if (maybeKey) {
    return maybeKey;
  }

  if (key === 'pilotes') {
    return isNumber(value) ? 'personnePiloteIds' : 'utilisateurPiloteIds';
  }
  if (key === 'referents') {
    return isNumber(value) ? 'personneReferenteIds' : 'utilisateurReferentIds';
  }
  return null;
};

const generateSearchParams = (
  filters: Filters,
  countByProperty: CountByPropertyEnumType,
  propertyValue: any
): string => {
  const searchParams = new URLSearchParams();

  const allFilters = {
    ...filters,
    //@TODO: clean up since we might use one function or the other to ease the comprehension
    ...getFilterPropertyOrItsNegationWhenNull(countByProperty, propertyValue),
    ...getCorrectKeyAndValue(countByProperty, propertyValue),
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

  return `${baseUrl}?${searchParams}`;
};
