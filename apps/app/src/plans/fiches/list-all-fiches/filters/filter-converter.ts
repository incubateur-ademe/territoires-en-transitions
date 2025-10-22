import { typePeriodeEnumValues } from '@/domain/plans';
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
  NotesDeSuiviOptions,
  WITH,
  WITH_RECENT,
  WithOrWithoutOptions,
  WITHOUT,
  WITHOUT_RECENT,
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

const fromNotesDeSuiviToBackendFilters = (
  value: NotesDeSuiviOptions | undefined
): { hasNoteDeSuivi?: boolean; hasNoteDeSuiviRecente?: boolean } => {
  if (value === undefined) {
    return {};
  }

  switch (value) {
    case WITH:
      return { hasNoteDeSuivi: true };
    case WITHOUT:
      return { hasNoteDeSuivi: false };
    case WITH_RECENT:
      return { hasNoteDeSuiviRecente: true };
    case WITHOUT_RECENT:
      return { hasNoteDeSuiviRecente: false };
    default:
      return {};
  }
};

const fromBackendFiltersToNotesDeSuivi = (
  hasNoteDeSuivi?: boolean,
  hasNoteDeSuiviRecente?: boolean
): NotesDeSuiviOptions | undefined => {
  if (hasNoteDeSuiviRecente !== undefined) {
    return hasNoteDeSuiviRecente ? WITH_RECENT : WITHOUT_RECENT;
  }
  if (hasNoteDeSuivi !== undefined) {
    return hasNoteDeSuivi ? WITH : WITHOUT;
  }
  return undefined;
};

export const fromFiltersToFormFilters = (filters: Filters): FormFilters => {
  return {
    ...filters,
    hasIndicateurLies: fromBooleanToWithOrWithout(filters.hasIndicateurLies),
    hasMesuresLiees: fromBooleanToWithOrWithout(filters.hasMesuresLiees),
    hasDateDeFinPrevisionnelle: fromBooleanToWithOrWithout(
      filters.hasDateDeFinPrevisionnelle
    ),
    hasNoteDeSuivi: fromBackendFiltersToNotesDeSuivi(
      filters.hasNoteDeSuivi,
      filters.hasNoteDeSuiviRecente
    ),
    hasNoteDeSuiviRecente: fromBooleanToWithOrWithout(
      filters.hasNoteDeSuiviRecente
    ),
    hasBudget: fromBooleanToWithOrWithout(filters.hasBudget),
    sort: 'titre',
  };
};

export const fromFormFiltersToFilters = (
  filters: Partial<FormFilters>
): Filters => {
  const notesDeSuiviFilters = fromNotesDeSuiviToBackendFilters(
    filters.hasNoteDeSuivi
  );

  return {
    ...filters,
    hasIndicateurLies: fromWithOrWithoutToBoolean(filters.hasIndicateurLies),
    hasMesuresLiees: fromWithOrWithoutToBoolean(filters.hasMesuresLiees),
    hasDateDeFinPrevisionnelle: fromWithOrWithoutToBoolean(
      filters.hasDateDeFinPrevisionnelle
    ),
    hasNoteDeSuivi: notesDeSuiviFilters.hasNoteDeSuivi,
    hasNoteDeSuiviRecente: notesDeSuiviFilters.hasNoteDeSuiviRecente,
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

const notesDeSuiviParser = createParser({
  parse: (value) => {
    if (value === undefined) {
      return null;
    }
    switch (value) {
      case 'WITH':
        return WITH;
      case 'WITHOUT':
        return WITHOUT;
      case 'WITH_RECENT':
        return WITH_RECENT;
      case 'WITHOUT_RECENT':
        return WITHOUT_RECENT;
      default:
        return null;
    }
  },
  serialize: (value) => {
    if (value === null) {
      return '';
    }
    return value;
  },
});

const notesDeSuiviArrayParserWithFlag = (): Parser<any> => {
  const parser = notesDeSuiviParser;
  // Attach a flag to identify this as a notes de suivi parser
  (parser as any).isNotesDeSuiviParser = true;
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

  hasNoteDeSuivi: notesDeSuiviArrayParserWithFlag(),
  hasNoteDeSuiviRecente: withOrWithoutArrayParserWithFlag(),
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
