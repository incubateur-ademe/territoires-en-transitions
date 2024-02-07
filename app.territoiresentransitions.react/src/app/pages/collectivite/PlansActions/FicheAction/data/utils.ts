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
export const sortFichesResume = (fiches: FicheResume[]): FicheResume[] => {
  return fiches.sort((a: FicheResume, b: FicheResume) => {
    if (!a.titre) return -1;
    if (!b.titre) return 1;
    return naturalSort(a.titre, b.titre);
  });
};

type FactoryArgs = {
  collectivite_id: number;
  axeFichesIds?: number[] | null;
  axe_id?: number;
};

export const ficheResumeFactory = ({
  collectivite_id,
  axeFichesIds,
  axe_id,
}: FactoryArgs): FicheResume => {
  const lowerId = axeFichesIds
    ? axeFichesIds.reduce((a, b) => (a < b ? a : b))
    : 0;
  const tempId = Math.min(0, lowerId || 0) - 1;
  return {
    id: tempId,
    collectivite_id,
    date_fin_provisoire: null,
    amelioration_continue: null,
    modified_at: null,
    niveau_priorite: null,
    pilotes: null,
    plans: axe_id ? [{id: axe_id, collectivite_id}] : null,
    statut: null,
    titre: null,
    restreint: false,
  };
};
