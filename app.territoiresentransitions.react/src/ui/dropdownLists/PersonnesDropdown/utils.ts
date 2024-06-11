import {Personne} from 'ui/dropdownLists/PersonnesDropdown/usePersonneListe';

/**
 * Renvoie l'id en string d'un type Personne qui est soit un tag_id number ou un user_id string
 * @param personne
 * @returns id as string
 */
export const getPersonneStringId = (personne: Personne): string =>
  personne.tag_id ? personne.tag_id.toString() : personne.user_id!;
