import { ValeurField, Year } from './types';

export const isResultatEditable = (year: Year, now: number): boolean =>
  year <= now;

export const pasteFieldForYear = (year: Year, now: number): ValeurField =>
  year > now ? 'objectif' : 'resultat';

/**
 * Champs ouverts pour une année. L'année de référence ne porte qu'un résultat :
 * elle désigne l'année à laquelle l'inventaire se rapporte, et se fixer une
 * cible sur une année révolue n'a pas de sens. Un horizon déjà écoulé garde en
 * revanche ses deux champs — la cible avait été posée quand il était à venir.
 */
export const valueFieldsForYear = (
  year: Year,
  now: number,
  referenceYear?: Year | null
): readonly ValeurField[] => {
  if (referenceYear !== undefined && referenceYear !== null && year === referenceYear) {
    return ['resultat'];
  }
  return isResultatEditable(year, now) ? ['resultat', 'objectif'] : ['objectif'];
};

export const valueColumnCountForYears = (
  years: readonly Year[],
  now: number,
  referenceYear?: Year | null
): number =>
  years.reduce(
    (count, year) => count + valueFieldsForYear(year, now, referenceYear).length,
    0
  );
