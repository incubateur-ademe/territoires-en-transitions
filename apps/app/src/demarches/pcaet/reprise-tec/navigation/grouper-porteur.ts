import type { RecetteCollectivite } from '../data/use-list-collectivites';

export type GroupePorteur = 'epci' | 'petr' | 'syndicat' | 'commune' | 'autre';

const EPCI = new Set(['CC', 'CA', 'CU', 'METRO', 'MET69', 'EPT']);

export const grouperPorteur = (
  c: Pick<RecetteCollectivite, 'natureTet' | 'typeTet'>
): GroupePorteur => {
  const nature = c.natureTet ?? '';
  if (EPCI.has(nature)) return 'epci';
  if (nature === 'PETR' || nature === 'POLEM') return 'petr';
  if (/^(SM|SIV)/.test(nature)) return 'syndicat';
  if (c.typeTet === 'commune') return 'commune';
  return 'autre';
};

export const GROUPES_AUTRES: Exclude<GroupePorteur, 'epci'>[] = [
  'petr',
  'syndicat',
  'commune',
  'autre',
];
