import {useEffect, useMemo, useState} from 'react';
import {useHistory, useLocation} from 'react-router-dom';
import {ITEM_ALL} from 'ui/shared/MultiSelectFilter';

export const useQuery = (): URLSearchParams => {
  const {search} = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

export type TParams = Record<string, unknown>;
type TNamesMap = Record<string, string>;

/**
 * Permet de synchroniser un objet avec les paramètres de recherche d'une URL
 */
export const useSearchParams = <T extends TParams>(
  viewName: string,
  initialParams: T,
  nameToShortName: TNamesMap
): [params: T, setParams: (newParams: T) => void, paramsCount: number] => {
  const history = useHistory();
  const location = useLocation();
  const shortNameToName = useMemo(
    () => invertKeyValues(nameToShortName),
    [nameToShortName]
  );

  // extrait les paramètres de l'url si ils sont disponibles (ou utilise les
  // valeurs par défaut pour l'initialisation)
  const searchParams = useQuery();
  const currentParamsFromURL = searchParamsToObject<T>(
    searchParams,
    initialParams,
    shortNameToName
  );

  // conserve les paramètres dans l'état interne
  const [params, setParams] = useState(currentParamsFromURL);
  const paramsCount = useMemo(() => getParamsCount(params), [params]);

  // synchronise l'url à partir de l'état interne
  useEffect(() => {
    const search = objectToSearchParams(params, nameToShortName);
    if (
      location.pathname.endsWith(viewName) &&
      searchParams.toString() !== search
    ) {
      history.replace({...location, search: '?' + search});
    }
  }, [params, location.pathname]);

  return [params, setParams, paramsCount];
};

// converti les paramètres de recherche d'une URL en un objet
// ex: "?p1=v1&p2=v2,v3" sera converti en {prop1: ['v1'], prop2: ['v2', 'v3'], prop3: ['v4']}
// avec initialParams = {prop3: ['v4']} et shortNameToName = {p1: 'prop1', p2: 'prop2', p3: 'prop3'}
export const searchParamsToObject = <T extends TParams>(
  params: URLSearchParams,
  initialParams: T,
  shortNameToName: TNamesMap
): T => {
  const ret: TParams = {};
  params.forEach((value, key) => {
    if (shortNameToName[key]) {
      ret[shortNameToName[key]] = value?.split(',');
    }
  });
  return {...initialParams, ...ret};
};

// fait l'opération inverse
export const objectToSearchParams = (
  obj: TParams,
  nameToShorName: TNamesMap
): string =>
  Object.entries(obj)
    .reduce(
      (ret, [key, value]) =>
        nameToShorName[key]
          ? [
              ...ret,
              nameToShorName[key] +
                '=' +
                (typeof (value as string[]).join === 'function'
                  ? (value as string[]).join(',')
                  : String(value)),
            ]
          : ret,
      [] as string[]
    )
    .join('&');

// inverse les clés/valeurs d'un objet et renvoi le nouvel objet
const invertKeyValues = (obj: TNamesMap) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k]));

// compte les paramètres actifs
const getParamsCount = (params: TParams) =>
  Object.values(params).reduce((cnt: number, f) => cnt + paramsLength(f), 0);

const paramsLength = (params: unknown | unknown[]) => {
  if (Array.isArray(params)) {
    return params?.length && !params.includes(ITEM_ALL) ? params.length : 0;
  }
  return params !== undefined ? 1 : 0;
};
