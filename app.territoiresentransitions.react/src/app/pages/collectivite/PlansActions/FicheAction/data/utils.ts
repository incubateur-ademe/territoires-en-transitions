import {naturalSort} from 'utils/naturalSort';
import {FicheResume, Personne} from './types';

/**
 * Formate un nouveau tag qui nécessite un type minimum collectivite_id, nom
 * @param inputValue
 * @param collectivite_id
 */
export const formatNewTag = (inputValue: string, collectivite_id: number) => ({
  collectivite_id,
  nom: inputValue,
});

/**
 * Renvoie l'id en string d'un type Personne aui est soit un tag_id number ou un user_id string
 * @param personne
 * @returns id as string
 */
export const getPersonneId = (personne: Personne): string =>
  personne.tag_id ? personne.tag_id.toString() : personne.user_id!;

/** Renvoie "Sans titre" si le string est undefined ou null */
export const generateTitle = (title?: string | null) => title || 'Sans titre';

/** Ordonne les fiches résumé par titre */
export const ficheResumeByTitle = (a: FicheResume, b: FicheResume) => {
  if (!a.titre) return -1;
  if (!b.titre) return 1;
  return naturalSort(a.titre, b.titre);
export const sortFichesResume = (fiches: FicheResume[]): FicheResume[] => {
  return fiches.sort((a: FicheResume, b: FicheResume) => {
    if (!a.titre) return -1;
    if (!b.titre) return 1;
    return naturalSort(a.titre, b.titre);
  });
};
