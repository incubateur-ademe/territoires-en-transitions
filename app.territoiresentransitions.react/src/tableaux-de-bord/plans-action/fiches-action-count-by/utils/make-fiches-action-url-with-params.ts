
import { useFiltersToParams } from '@/app/app/pages/collectivite/PlansActions/ToutesLesFichesAction/useFiltersToParams';
import { makeCollectiviteToutesLesFichesUrl } from '@/app/app/paths';
import {
  CountByPropertyEnumType,
  ListFichesRequestFilters as Filters,
} from '@/domain/plans/fiches';

const {
  nameToparams,
} = useFiltersToParams();

const getFicheActionFiltreKeyValue = (
  countByProperty: CountByPropertyEnumType,
  propertyValue: string | number | null | boolean
): {
  key: keyof Filters;
  value: string | number | boolean | null;
} | null => {
  switch (countByProperty) {
    case 'statut':
      return (propertyValue) ? { key: 'statuts', value: propertyValue } : { key: 'noStatut', value: true };

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
      return (propertyValue) ? { key: 'servicePiloteIds', value: propertyValue } : { key: 'noServicePilote', value: true };
    case 'cibles':
      return (propertyValue) ? { key: 'cibles', value: propertyValue } : null
    case 'priorite':
      return (propertyValue) ? { key: 'priorites', value: propertyValue } : { key: 'noPriorite', value: true };
    case 'dateFin':
      return (propertyValue) ? { key: 'hasDateDeFinPrevisionnelle', value: propertyValue } : { key: 'hasDateDeFinPrevisionnelle', value: false };
    case 'partenaires':
      return (propertyValue) ? { key: 'partenaireIds', value: propertyValue } : null;
    case 'structures':
      return (propertyValue) ? { key: 'structurePiloteIds', value: propertyValue } : null;
    case 'libreTags':
      return (propertyValue) ? { key: 'libreTagsIds', value: propertyValue } : null;
    case 'financeurs':
      return (propertyValue) ? { key: 'financeurIds', value: propertyValue } : null;
    case 'thematiques':
      return (propertyValue) ? { key: 'thematiqueIds', value: propertyValue } : null;
    case 'plans':
      return (propertyValue) ? { key: 'planActionIds', value: propertyValue } : null;
    case 'notes':
      return (propertyValue) ? { key: 'anneesNoteDeSuivi', value: propertyValue } : { key: 'hasNoteDeSuivi', value: false };
    case 'indicateurs':
      return (propertyValue) ? { key: 'hasIndicateurLies', value: true } : { key: 'hasIndicateurLies', value: false };
    case 'mesures':
      return { key: 'hasMesuresLiees', value: propertyValue ? true : false };
    case 'ameliorationContinue':
      return (propertyValue) ? { key: 'ameliorationContinue', value: true } : null;
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
  filtres: Filters,
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

  Object.keys(filtres).forEach((key) => {
    const filterKey = key as keyof Filters;
    const value = filtres[filterKey];

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
