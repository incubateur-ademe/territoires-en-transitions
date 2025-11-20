import {
  notesDeSuiviOptionValues,
  typePeriodeEnumValues,
} from '@tet/domain/plans';
import { mapValues } from 'es-toolkit/object';
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
import {
  FilterKeys,
  Filters,
  FormFilters,
  WITH,
  WithOrWithoutOptions,
  WITHOUT,
} from './types';

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
  const {
    hasIndicateurLies,
    hasMesuresLiees,
    hasDateDeFinPrevisionnelle,
    hasBudget,
    ...rest
  } = filters;

  return {
    ...rest,
    hasIndicateurLies: fromBooleanToWithOrWithout(hasIndicateurLies),
    hasMesuresLiees: fromBooleanToWithOrWithout(hasMesuresLiees),
    hasDateDeFinPrevisionnelle: fromBooleanToWithOrWithout(
      hasDateDeFinPrevisionnelle
    ),
    hasBudget: fromBooleanToWithOrWithout(hasBudget),
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
    hasBudget: fromWithOrWithoutToBoolean(filters.hasBudget),
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

const withOrWithoutArrayParserWithFlag = (): Parser<any> => {
  const parser = withOrWithoutParser;
  // Attach a flag to identify this as an "with or without" parser
  (parser as any).isWithOrWithoutArrayParser = true;
  return parser;
};

function parseAsArrayOfWithFlag<T>(itemParser: Parser<T>): Parser<T[]> {
  const parser = parseAsArrayOf(itemParser);
  // Attach a flag to identify this as an array parser
  (parser as any).isArrayParser = true;
  return parser;
}

export const searchParametersParser: Record<FilterKeys, Parser<any>> = {
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
  noTitre: parseAsBoolean,
  noDescription: parseAsBoolean,
  noObjectif: parseAsBoolean,
  sharedWithCollectivites: parseAsBoolean,
  hasAtLeastBeginningOrEndDate: parseAsBoolean,

  notesDeSuivi: parseAsStringEnum([...notesDeSuiviOptionValues]),
  hasIndicateurLies: withOrWithoutArrayParserWithFlag(),
  hasMesuresLiees: withOrWithoutArrayParserWithFlag(),
  hasDateDeFinPrevisionnelle: withOrWithoutArrayParserWithFlag(),
  hasBudget: withOrWithoutArrayParserWithFlag(),

  planActionIds: parseAsArrayOfWithFlag(parseAsInteger),
  axesId: parseAsArrayOfWithFlag(parseAsInteger),
  ficheIds: parseAsArrayOfWithFlag(parseAsInteger),
  linkedFicheIds: parseAsArrayOfWithFlag(parseAsInteger),
  partenaireIds: parseAsArrayOfWithFlag(parseAsInteger),
  personnePiloteIds: parseAsArrayOfWithFlag(parseAsInteger),
  structurePiloteIds: parseAsArrayOfWithFlag(parseAsInteger),
  servicePiloteIds: parseAsArrayOfWithFlag(parseAsInteger),
  libreTagsIds: parseAsArrayOfWithFlag(parseAsInteger),
  thematiqueIds: parseAsArrayOfWithFlag(parseAsInteger),
  financeurIds: parseAsArrayOfWithFlag(parseAsInteger),
  personneReferenteIds: parseAsArrayOfWithFlag(parseAsInteger),
  sousThematiqueIds: parseAsArrayOfWithFlag(parseAsInteger),
  indicateurIds: parseAsArrayOfWithFlag(parseAsInteger),

  statuts: parseAsArrayOfWithFlag(parseAsString),
  priorites: parseAsArrayOfWithFlag(parseAsString),
  cibles: parseAsArrayOfWithFlag(parseAsString),
  anneesNoteDeSuivi: parseAsArrayOfWithFlag(parseAsString),
  utilisateurPiloteIds: parseAsArrayOfWithFlag(parseAsString),
  utilisateurReferentIds: parseAsArrayOfWithFlag(parseAsString),

  typePeriode: parseAsStringEnum([...typePeriodeEnumValues]),
  debutPeriode: parseAsString,
  finPeriode: parseAsString,
  sort: parseAsString,
};

const emptyFilters = Object.keys(searchParametersParser).reduce((acc, key) => {
  acc[key as FilterKeys] = null;
  return acc;
}, {} as Record<FilterKeys, null>);

export const parameterMustBeNull = (value: any) => {
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
