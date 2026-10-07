import { PcaetIndicateurValeurType } from './types';

export const isResultatEditable = (year: number, now: number): boolean =>
  year <= now;

/**
 * Champs ouverts pour une année. L'année de référence ne porte qu'un résultat :
 * elle désigne l'année à laquelle l'inventaire se rapporte, et se fixer une
 * cible sur une année révolue n'a pas de sens. Un horizon déjà écoulé garde en
 * revanche ses deux champs — la cible avait été posée quand il était à venir.
 */
export const valueFieldsForYear = (
  year: number,
  now: number
): readonly PcaetIndicateurValeurType[] => {
  return isResultatEditable(year, now) ? ['resultat'] : ['objectif'];
};
