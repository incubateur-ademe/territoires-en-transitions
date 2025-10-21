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
} from '@/domain/plans/fiches';
import { isNil } from 'es-toolkit/predicate';

const noValueCountByToFilterKeyMapping = {
  priorite: 'noPriorite',
  pilotes: 'noPilote',
  services: 'noServicePilote',
  referents: 'noReferent',
  libreTags: 'noTag',
  statut: 'noStatut',
  plans: 'noPlan',
} as const satisfies Partial<Record<CountByPropertyEnumType, FilterKeys>>;

const generalCountByToFilterKeyMapping = {
  statut: 'statuts',
  priorite: 'priorites',
  libreTags: 'libreTagsIds',
  cibles: 'cibles',
  financeurs: 'financeurIds',
  thematiques: 'thematiqueIds',
  indicateurs: 'hasIndicateurLies',
  structures: 'structurePiloteIds',
  services: 'servicePiloteIds',
  actionsParMesuresDeReferentiels: 'hasMesuresLiees',
  restreint: 'restreint',
  ameliorationContinue: 'ameliorationContinue',
  partenaires: 'partenaireIds',
  plans: 'planActionIds',
  sousThematiques: 'sousThematiqueIds',
  notes: 'hasNoteDeSuivi',
} as const satisfies Partial<Record<CountByPropertyEnumType, FilterKeys>>;

// Propriétés qui n'ont pas de mapping direct possible vers les filtres
const notSupportedCountByToFilterKeyMapping = {
  // Les dates utilisent un système de filtrage complexe (typePeriode + debutPeriode/finPeriode)
  dateDebut: null,
  dateFin: null,
  createdAt: null,
  modifiedAt: null,
  // Pas de filtres correspondants dans le système actuel
  participationCitoyenneType: null,
  effetsAttendus: null,
  // Les budgets utilisent uniquement hasBudgetPrevisionnel de manière générique
  budgetsPrevisionnelInvestissementTotal: null,
  budgetsPrevisionnelInvestissementParAnnee: null,
  budgetsDepenseInvestissementTotal: null,
  budgetsDepenseInvestissementParAnnee: null,
  budgetsPrevisionnelFonctionnementTotal: null,
  budgetsPrevisionnelFonctionnementParAnnee: null,
  budgetsDepenseFonctionnementTotal: null,
  budgetsDepenseFonctionnementParAnnee: null,
} as const satisfies Partial<Record<CountByPropertyEnumType, null>>;

export function isCountByPropertyNotSupportedInFilter(
  key: CountByPropertyEnumType
): boolean {
  return key in notSupportedCountByToFilterKeyMapping;
}

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
): Partial<Record<FilterKeys, any>> | null {
  if (key in noValueCountByToFilterKeyMapping && isNil(value)) {
    const filterKey =
      noValueCountByToFilterKeyMapping[
        key as keyof typeof noValueCountByToFilterKeyMapping
      ];
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
  if (key in generalCountByToFilterKeyMapping) {
    return generalCountByToFilterKeyMapping[
      key as keyof typeof generalCountByToFilterKeyMapping
    ];
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
