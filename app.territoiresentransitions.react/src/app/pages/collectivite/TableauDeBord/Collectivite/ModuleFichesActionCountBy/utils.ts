import { nameToparams } from '@/app/app/pages/collectivite/PlansActions/ToutesLesFichesAction/ToutesLesFichesAction';
import { makeCollectiviteToutesLesFichesUrl } from '@/app/app/paths';
import {
  CountByPropertyEnumType,
  ListFichesRequestFilters,
} from '@/domain/plans/fiches';

const getFicheActionFiltreKeyValue = (
  countByProperty: CountByPropertyEnumType,
  propertyValue: string | number | null | boolean
): {
  key: keyof ListFichesRequestFilters;
  value: string | number | boolean | null;
} | null => {
  switch (countByProperty) {
    case 'statut':
      if (propertyValue) {
        return { key: 'statuts', value: propertyValue };
      } else {
        return { key: 'noStatut', value: true };
      }

    case 'pilotes':
      if (typeof propertyValue === 'string') {
        return { key: 'utilisateurPiloteIds', value: propertyValue };
      } else if (!propertyValue) {
        return { key: 'noPilote', value: true };
      } else {
        return { key: 'personnePiloteIds', value: propertyValue };
      }
    case 'referents':
      if (typeof propertyValue === 'string') {
        return { key: 'utilisateurReferentIds', value: propertyValue };
      } else if (!propertyValue) {
        return null;
      } else {
        return { key: 'personneReferenteIds', value: propertyValue };
      }
    case 'services':
      if (propertyValue) {
        return { key: 'servicePiloteIds', value: propertyValue };
      } else {
        return { key: 'noServicePilote', value: true };
      }
    case 'cibles':
      if (propertyValue) {
        return { key: 'cibles', value: propertyValue };
      } else {
        return null;
      }
    case 'priorite':
      if (propertyValue) {
        return { key: 'priorites', value: propertyValue };
      } else {
        return null;
      }
    case 'partenaires':
      if (propertyValue) {
        return { key: 'partenaireIds', value: propertyValue };
      } else {
        return null;
      }
    case 'structures':
      if (propertyValue) {
        return { key: 'structurePiloteIds', value: propertyValue };
      } else {
        return null;
      }
    case 'libreTags':
      if (propertyValue) {
        return { key: 'libreTagsIds', value: propertyValue };
      } else {
        return null;
      }
    case 'financeurs':
      if (propertyValue) {
        return { key: 'financeurIds', value: propertyValue };
      } else {
        return null;
      }
    case 'thematiques':
      if (propertyValue) {
        return { key: 'thematiqueIds', value: propertyValue };
      } else {
        return null;
      }
    case 'plans':
      if (propertyValue) {
        return { key: 'planActionIds', value: propertyValue };
      } else {
        return null;
      }
    case 'indicateurs':
      if (propertyValue) {
        return { key: 'hasIndicateurLies', value: true };
      } else {
        return null;
      }
    case 'mesures':
      if (propertyValue) {
        return { key: 'hasMesuresLiees', value: true };
      } else {
        return null;
      }
    case 'ameliorationContinue':
      if (propertyValue) {
        return { key: 'ameliorationContinue', value: true };
      } else {
        return null;
      }
    case 'actionsParMesuresDeReferentiels':
      return { key: 'hasMesuresLiees', value: propertyValue };
    /*
      TODO à remplacer avec les nouveaux filtres des budgets
    case 'budgetPrevisionnel':
      if (propertyValue) {
        return { key: 'budgetPrevisionnel', value: true };
      } else {
        return null;
      }
       */

    // Not supported for now
    case 'participationCitoyenneType':
    case 'effetsAttendus':
    case 'sousThematiques':
      return null;

    default:
      return null;
  }
};

/** Permet de transformer les filtres de modules fiches action en paramètres d'URL */
export const makeFichesActionUrlWithParams = (
  collectiviteId: number,
  filtres: ListFichesRequestFilters,
  countByProperty: CountByPropertyEnumType,
  propertyValue: string | number | null | boolean
): string | null => {
  const filtre = getFicheActionFiltreKeyValue(countByProperty, propertyValue);

  if (!filtre) {
    // Prefer to return null instead of building an incomplete url
    return null;
  }

  const baseUrl = `${makeCollectiviteToutesLesFichesUrl({
    collectiviteId,
  })}?${nameToparams[filtre.key]}=${filtre.value}`;

  const searchParams = new URLSearchParams();

  const additionalFilters = excludeMainFilter(filtres, filtre.key);

  Object.keys(additionalFilters).forEach((key) => {
    const filterKey = key as keyof ListFichesRequestFilters;
    const value = (additionalFilters as ListFichesRequestFilters)[filterKey];
    const isArray = Array.isArray(value);

    const paramKey = nameToparams[filterKey];

    if (value !== undefined && !!paramKey) {
      if (isArray && value.length > 0) {
        searchParams.append(paramKey, isArray ? value.join(',') : value);
      } else {
        searchParams.append(paramKey, value.toString());
      }
    }
  });

  return `${baseUrl}&${searchParams.toString()}`;
};

/**
 * Removes the main filter from the filters list, so it doesn't get added to the url twice
 */
const excludeMainFilter = (
  filters: ListFichesRequestFilters,
  filterKey: keyof ListFichesRequestFilters
) => {
  if (filterKey == 'utilisateurPiloteIds' || filterKey == 'personnePiloteIds') {
    return excludeConflictingPilotesFilter(filterKey, filters);
  }
  const { [filterKey]: _, ...additionalFilters }: ListFichesRequestFilters =
    filters;
  return additionalFilters;
};

const excludeConflictingPilotesFilter = (
  filterKey: keyof ListFichesRequestFilters,
  filters: ListFichesRequestFilters
) => {
  if (filterKey === 'utilisateurPiloteIds') {
    const {
      personnePiloteIds,
      ...additionalFilters
    }: ListFichesRequestFilters = filters;
    return additionalFilters;
  }
  if (filterKey === 'personnePiloteIds') {
    const {
      utilisateurPiloteIds,
      ...additionalFilters
    }: ListFichesRequestFilters = filters;
    return additionalFilters;
  }
  return filters;
};
