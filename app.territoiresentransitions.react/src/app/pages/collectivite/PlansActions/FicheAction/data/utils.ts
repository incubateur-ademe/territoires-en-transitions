import {Personne} from './types';

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

/** formate la liste des personnes pilotes */
export const formatNomPilotes = (pilotes: Personne[]) => {
  if (!pilotes?.length) {
    return '';
  }
  return `Pilote${pilotes.length > 1 ? 's' : ''} : ${pilotes
    .map(({nom}) => nom)
    .join(', ')}`;
};
