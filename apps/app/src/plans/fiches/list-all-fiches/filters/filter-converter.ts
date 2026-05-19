import {
  notesOptionValues,
  Priorite,
  SANS_PRIORITE_LABEL,
  SANS_STATUT_LABEL,
  Statut,
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
  PrioriteOrNot,
  StatutOrNot,
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

export const fromApiStatutsToFormStatuts = (
  statuts?: Statut[],
  noStatut?: boolean
): StatutOrNot[] | undefined => {
  const formStatuts: StatutOrNot[] = [
    ...(statuts ?? []),
    ...(noStatut ? [SANS_STATUT_LABEL] : []),
  ];
  return formStatuts.length > 0 ? formStatuts : undefined;
};

export const fromFormStatutsToApiStatuts = (
  formStatuts?: StatutOrNot[]
): { statuts?: Statut[]; noStatut?: boolean } => {
  const withNoStatut = formStatuts?.includes(SANS_STATUT_LABEL);
  const statutsWithoutSansStatut = formStatuts?.filter(
    (s): s is Statut => s !== SANS_STATUT_LABEL
  );
  return {
    statuts:
      statutsWithoutSansStatut && statutsWithoutSansStatut.length > 0
        ? statutsWithoutSansStatut
        : undefined,
    noStatut: withNoStatut || undefined,
  };
};

export const fromApiPrioritesToFormPriorites = (
  priorites?: Priorite[],
  noPriorite?: boolean
): PrioriteOrNot[] | undefined => {
  const formPriorites: PrioriteOrNot[] = [
    ...(priorites ?? []),
    ...(noPriorite ? [SANS_PRIORITE_LABEL] : []),
  ];
  return formPriorites.length > 0 ? formPriorites : undefined;
};

export const fromFormPrioritesToApiPriorites = (
  formPriorites?: PrioriteOrNot[]
): { priorites?: Priorite[]; noPriorite?: boolean } => {
  const withNoPriorite = formPriorites?.includes(SANS_PRIORITE_LABEL);
  const prioritesWithoutSansPriorite = formPriorites?.filter(
    (p): p is Priorite => p !== SANS_PRIORITE_LABEL
  );
  return {
    priorites:
      prioritesWithoutSansPriorite && prioritesWithoutSansPriorite.length > 0
        ? prioritesWithoutSansPriorite
        : undefined,
    noPriorite: withNoPriorite || undefined,
  };
};

export const fromFiltersToFormFilters = (filters: Filters): FormFilters => {
  const {
    hasIndicateurLies,
    hasMesuresLiees,
    hasDateDeFinPrevisionnelle,
    hasBudget,
    noStatut,
    statuts: apiStatuts,
    noPriorite,
    priorites: apiPriorites,
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
    statuts: fromApiStatutsToFormStatuts(apiStatuts, noStatut),
    priorites: fromApiPrioritesToFormPriorites(apiPriorites, noPriorite),
    sort: 'titre',
  };
};

export const fromFormFiltersToFilters = (
  filters: Partial<FormFilters>
): Filters => {
  const { statuts: formStatuts, priorites: formPriorites, ...rest } = filters;

  return {
    ...rest,
    hasIndicateurLies: fromWithOrWithoutToBoolean(filters.hasIndicateurLies),
    hasMesuresLiees: fromWithOrWithoutToBoolean(filters.hasMesuresLiees),
    hasDateDeFinPrevisionnelle: fromWithOrWithoutToBoolean(
      filters.hasDateDeFinPrevisionnelle
    ),
    hasBudget: fromWithOrWithoutToBoolean(filters.hasBudget),
    ...fromFormStatutsToApiStatuts(formStatuts),
    ...fromFormPrioritesToApiPriorites(formPriorites),
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

  notes: parseAsStringEnum([...notesOptionValues]),
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
  instanceGouvernanceIds: parseAsArrayOfWithFlag(parseAsInteger),
  thematiqueIds: parseAsArrayOfWithFlag(parseAsInteger),
  financeurIds: parseAsArrayOfWithFlag(parseAsInteger),
  personneReferenteIds: parseAsArrayOfWithFlag(parseAsInteger),
  sousThematiqueIds: parseAsArrayOfWithFlag(parseAsInteger),
  indicateurIds: parseAsArrayOfWithFlag(parseAsInteger),

  statuts: parseAsArrayOfWithFlag(parseAsString),
  priorites: parseAsArrayOfWithFlag(parseAsString),
  cibles: parseAsArrayOfWithFlag(parseAsString),
  anneesNotes: parseAsArrayOfWithFlag(parseAsString),
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
