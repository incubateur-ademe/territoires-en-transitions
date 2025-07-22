import { typePeriodeEnumValues } from '@/backend/plans/fiches/index-domain';
import { mapValues } from 'lodash';
import {
  createParser,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  Parser,
  useQueryStates,
} from 'nuqs';
import { nameToparams } from './filters-search-parameters-mapper';
import { WITH, WithOrWithoutOptions, WITHOUT } from './options';
import { FilterKeys, Filters, FormFilters } from './types';

export const fromWithOrWithoutToBoolean = (
  value: WithOrWithoutOptions | undefined
) => {
  if (value === undefined) {
    return undefined;
  }
  return value === WITH;
};
const fromBooleanToWithOrWithout = (
  value: boolean | undefined
): WithOrWithoutOptions | undefined => {
  if (value === undefined) {
    return undefined;
  }
  return value ? WITH : WITHOUT;
};

export const fromFiltersToFormFilters = (filters: Filters): FormFilters => {
  return {
    ...filters,
    hasIndicateurLies: fromBooleanToWithOrWithout(filters.hasIndicateurLies),
    hasMesuresLiees: fromBooleanToWithOrWithout(filters.hasMesuresLiees),
    hasDateDeFinPrevisionnelle: fromBooleanToWithOrWithout(
      filters.hasDateDeFinPrevisionnelle
    ),
    hasNoteDeSuivi: fromBooleanToWithOrWithout(filters.hasNoteDeSuivi),
    sort: 'titre',
  };
};

export const fromFormFiltersToFilters = (
  filters: Partial<FormFilters>
): Filters => {
  return {
    ...filters,
    hasIndicateurLies: fromWithOrWithoutToBoolean(filters.hasIndicateurLies),
    hasMesuresLiees: fromWithOrWithoutToBoolean(filters.hasMesuresLiees),
    hasDateDeFinPrevisionnelle: fromWithOrWithoutToBoolean(
      filters.hasDateDeFinPrevisionnelle
    ),
    hasNoteDeSuivi: fromWithOrWithoutToBoolean(filters.hasNoteDeSuivi),
  };
};

const withOrWithoutParser = createParser({
  parse: (value) => {
    if (value === undefined) {
      return null;
    }
    return value === 'true' ? WITH : WITHOUT;
  },
  serialize: (value) => {
    if (value === null) {
      return '';
    }
    return value === WITH ? 'true' : 'false';
  },
});

const searchParametersParser: Record<FilterKeys, Parser<any>> = {
  noPlan: parseAsBoolean,

  noPilote: parseAsBoolean,
  ameliorationContinue: parseAsBoolean,
  restreint: parseAsBoolean,
  noServicePilote: parseAsBoolean,
  noStatut: parseAsBoolean,
  noPriorite: parseAsBoolean,
  noReferent: parseAsBoolean,
  doesBelongToSeveralPlans: parseAsBoolean,
  noTag: parseAsBoolean,
  sharedWithCollectivites: parseAsBoolean,

  hasNoteDeSuivi: withOrWithoutParser,
  hasIndicateurLies: withOrWithoutParser,
  hasMesuresLiees: withOrWithoutParser,
  hasDateDeFinPrevisionnelle: withOrWithoutParser,

  planActionIds: parseAsArrayOf(parseAsInteger),
  ficheIds: parseAsArrayOf(parseAsInteger),
  linkedFicheIds: parseAsArrayOf(parseAsInteger),
  partenaireIds: parseAsArrayOf(parseAsInteger),
  personnePiloteIds: parseAsArrayOf(parseAsInteger),
  structurePiloteIds: parseAsArrayOf(parseAsInteger),
  servicePiloteIds: parseAsArrayOf(parseAsInteger),
  libreTagsIds: parseAsArrayOf(parseAsInteger),
  thematiqueIds: parseAsArrayOf(parseAsInteger),
  financeurIds: parseAsArrayOf(parseAsInteger),
  personneReferenteIds: parseAsArrayOf(parseAsInteger),
  sousThematiqueIds: parseAsArrayOf(parseAsInteger),

  statuts: parseAsArrayOf(parseAsString),
  priorites: parseAsArrayOf(parseAsString),
  cibles: parseAsArrayOf(parseAsString),
  anneesNoteDeSuivi: parseAsArrayOf(parseAsString),
  utilisateurPiloteIds: parseAsArrayOf(parseAsString),
  utilisateurReferentIds: parseAsArrayOf(parseAsString),

  typePeriode: parseAsStringEnum(typePeriodeEnumValues as unknown as string[]),
  debutPeriode: parseAsString,
  finPeriode: parseAsString,
  sort: parseAsString,
};

const emptyFilters = Object.keys(searchParametersParser).reduce((acc, key) => {
  acc[key as FilterKeys] = null;
  return acc;
}, {} as Record<FilterKeys, null>);

const parameterMustBeNull = (value: any) => {
  return (
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
};
export function useFicheFiltersFromUrl(): {
  filters: FormFilters;
  setFilters: (filters: Partial<FormFilters> | null) => void;
} {
  const [filtersFromSearchParamters, setSearchParameters] = useQueryStates(
    searchParametersParser,
    {
      urlKeys: nameToparams,
    }
  );
  const filters = mapValues(filtersFromSearchParamters, (value: any) => {
    /**
     * nuqs set value to null if the value is undefined
     * but one needs undefined on the form filters
     */
    if (value === null) {
      return undefined;
    }
    return value;
  });

  const setFilters = (filters: Partial<FormFilters> | null) => {
    const sanitizedFilters = mapValues(filters ?? {}, (value: any) => {
      if (parameterMustBeNull(value)) {
        //nuqs expect null values only when a param is not present
        return null;
      }
      return value;
    });
    setSearchParameters({ ...emptyFilters, ...sanitizedFilters });
  };
  return { filters, setFilters };
}
