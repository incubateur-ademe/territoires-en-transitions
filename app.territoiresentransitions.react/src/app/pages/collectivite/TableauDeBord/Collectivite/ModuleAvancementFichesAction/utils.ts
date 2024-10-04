import { Statut } from '@tet/api/plan-actions';
import { Filtre } from '@tet/api/plan-actions/dashboards/collectivite-dashboard/domain/fiches-synthese.schema';
import { FicheActionParam } from '@tet/app/pages/collectivite/PlansActions/ToutesLesFichesAction/ToutesLesFichesAction';
import { makeCollectiviteToutesLesFichesUrl } from '@tet/app/paths';

/** Permet de transformer les filtres de modules fiches action en paramètres d'URL */
export const makeFichesActionUrlWithParams = (
  collectiviteId: number,
  filtres: Filtre,
  statut: Statut
): string => {
  const baseUrl = `${makeCollectiviteToutesLesFichesUrl({
    collectiviteId,
  })}?s=${statut}`;

  const searchParams = new URLSearchParams();

  Object.keys(filtres).forEach((key) => {
    const filterKey = key as keyof Filtre;
    const value = filtres[filterKey];

    const isArray = Array.isArray(value);

    const getKey = (filterKey: keyof Filtre): FicheActionParam | undefined => {
      if (filterKey === 'planActionIds') return 'pa';
      if (filterKey === 'utilisateurPiloteIds') return 'up';
      if (filterKey === 'personnePiloteIds') return 'pp';
      if (filterKey === 'servicePiloteIds') return 'sv';
      if (filterKey === 'partenaireIds') return 'pt';
      if (filterKey === 'cibles') return 'c';
      if (filterKey === 'modifiedSince') return 'ms';
    };

    const paramKey = getKey(filterKey);

    if (value !== undefined && !!paramKey) {
      if (
        (isArray && value.length > 0) ||
        (typeof value === 'string' && value.length > 0)
      ) {
        searchParams.append(paramKey, isArray ? value.join(',') : value);
      } else {
        searchParams.append(paramKey, value.toString());
      }
    }
  });

  return `${baseUrl}&${searchParams.toString()}`;
};
