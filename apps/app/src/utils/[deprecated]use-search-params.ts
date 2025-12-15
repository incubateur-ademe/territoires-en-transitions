'use client';
import { ITEM_ALL } from '@tet/ui';
import {
  usePathname,
  useRouter,
  useSearchParams as useSearchParamsNext,
} from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const useQuery = (): URLSearchParams => {
  const search = useSearchParamsNext();
  return useMemo(() => new URLSearchParams(search), [search]);
};

export type TParams = Record<string, unknown>;
type TNamesMap = Record<string, string>;

/**
 * Permet de synchroniser un objet avec les paramètres de recherche d'une URL
 * @deprecated use nuqs instead
 */
export const useSearchParams = <T extends TParams>(
  viewName: string,
  initialParams: T,
  nameToShortName: TNamesMap,
  scrollToTop = false
): [
  params: T,
  setParams: (newParams: T) => void,
  paramsCount: number,
  setView: (newView: string) => void
] => {
  const router = useRouter();
  const pathname = usePathname();
  const shortNameToName = useMemo(
    () => invertKeyValues(nameToShortName),
    [nameToShortName]
  );

  const [view, setView] = useState(viewName);

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
    if (pathname.endsWith(view) && searchParams.toString() !== search) {
      router.replace(`${pathname}?${search.toString()}`, {
        scroll: scrollToTop,
      });
    }
  }, [params, pathname]);

  // besoin de ça car les params ne s'actualisent pas au changement d'URL entre 2 plans
  useEffect(() => {
    setParams(currentParamsFromURL);
  }, [pathname]);

  return [params, setParams, paramsCount, setView];
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
      ret[shortNameToName[key]] = value
        ?.split(',')
        ?.filter((s) => s !== '')
        .map((s) => {
          try {
            return decodeURIComponent(s);
          } catch {
            return s;
          }
        });
    }
  });
  return { ...initialParams, ...ret };
};

// fait l'opération inverse
export const objectToSearchParams = (
  obj: TParams,
  nameToShorName: TNamesMap
): string =>
  Object.entries(obj)
    .reduce(
      (ret, [key, value]) =>
        nameToShorName[key] && value !== undefined
          ? [
              ...ret,
              nameToShorName[key] +
                '=' +
                encodeURIComponent(
                  typeof (value as string[]).join === 'function'
                    ? (value as string[]).join(',')
                    : String(value)
                ),
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
