'use client';

import { RouterOutput } from '@tet/api';
import {
  demarchePcaetStatusValues,
  type DemarchePcaetStatus,
} from '@tet/domain/demarches';
import { parseAsArrayOf, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { useCallback, useMemo } from 'react';

export type Demarche = RouterOutput['demarches']['pcaet']['list'][number];

const SORT_VALUES = [
  'titre',
  'pilotes',
  'statut',
  'creation',
  'lancement',
  'modification',
] as const;
const DIRECTION_VALUES = ['asc', 'desc'] as const;

export type ColonneTriable = (typeof SORT_VALUES)[number];
export type DirectionTri = (typeof DIRECTION_VALUES)[number];

const parsers = {
  // L'ordre que rendait le serveur avant que la liste ne se trie : les
  // démarches les plus récentes en tête.
  sort: parseAsStringLiteral(SORT_VALUES).withDefault('creation'),
  direction: parseAsStringLiteral(DIRECTION_VALUES).withDefault('desc'),
  statuts: parseAsArrayOf(
    parseAsStringLiteral(demarchePcaetStatusValues)
  ).withDefault([]),
};

const collator = new Intl.Collator('fr', { sensitivity: 'base' });

/**
 * La valeur sur laquelle trier, `null` quand il n'y en a pas : une démarche
 * sans pilote ni date se range toujours en fin de liste, quel que soit le sens.
 */
const sortValue = (
  demarche: Demarche,
  colonne: ColonneTriable
): string | number | null => {
  switch (colonne) {
    case 'titre':
      return demarche.titre;
    case 'pilotes':
      return demarche.pilotes.map((pilote) => pilote.nom).join(', ') || null;
    // Dans l'ordre du cycle de vie, et non dans l'ordre alphabétique des
    // libellés.
    case 'statut':
      return demarchePcaetStatusValues.indexOf(demarche.status);
    case 'creation':
      return demarche.createdAt;
    case 'lancement':
      return demarche.launchedAt;
    case 'modification':
      return demarche.modifiedAt;
  }
};

const compare = (
  a: string | number | null,
  b: string | number | null
): number => {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return collator.compare(String(a), String(b));
};

/**
 * Tri et filtre de la liste des démarches, côté client : une collectivité n'en
 * compte qu'une poignée, la liste arrive entière. L'état vit dans l'URL, comme
 * sur la liste d'instruction des services.
 */
export const useFilterDemarchesPcaet = (demarches: Demarche[] | undefined) => {
  const [{ sort, direction, statuts }, setParams] = useQueryStates(parsers, {
    urlKeys: { sort: '$s', direction: '$d', statuts: '$st' },
    // Un tri ou un filtre n'est pas une étape de navigation.
    history: 'replace',
  });

  const items = useMemo(() => {
    const filtrees = (demarches ?? []).filter(
      (demarche) => statuts.length === 0 || statuts.includes(demarche.status)
    );
    const sens = direction === 'asc' ? 1 : -1;
    return filtrees.sort((a, b) => {
      const va = sortValue(a, sort);
      const vb = sortValue(b, sort);
      if (va === null || vb === null) {
        return Number(va === null) - Number(vb === null);
      }
      return sens * compare(va, vb);
    });
  }, [demarches, sort, direction, statuts]);

  const trierPar = useCallback(
    (colonne: ColonneTriable) =>
      setParams({
        sort: colonne,
        direction: sort === colonne && direction === 'asc' ? 'desc' : 'asc',
      }),
    [setParams, sort, direction]
  );

  const setStatuts = useCallback(
    (nouveaux: DemarchePcaetStatus[]) => setParams({ statuts: nouveaux }),
    [setParams]
  );

  return {
    items,
    sort,
    direction,
    trierPar,
    statuts,
    setStatuts,
    reinitialiserFiltres: () => setParams({ statuts: null }),
  };
};
