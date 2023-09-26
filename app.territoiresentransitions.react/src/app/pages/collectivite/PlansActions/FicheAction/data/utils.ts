import {FicheAction, FicheResume, Personne} from './types';
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

export const createFicheResume = ({
  collectivite_id,
  axeId,
}: {
  collectivite_id: number;
  axeId: number;
}): FicheResume => {
  const newFiche = {
    id: null,
    collectivite_id,
    modified_at: null,
    // plans: [{id: axeId, collectivite_id}],
    plans: [
      {
        collectivite_id,
        id: axeId,
        // created_at: null,
        // modified_at: string,
        // modified_by: null,
        // nom: string | null
        // parent: number | null
      },
    ],
    titre: null,
    date_fin_provisoire: null,
    niveau_priorite: null,
    pilotes: null,
    statut: null,
  };
  return newFiche;
};

export const updateFichesResumeFromFicheAction = ({
  fichesResume,
  ficheAction,
}: {
  fichesResume: FicheResume[];
  ficheAction: FicheAction;
}): FicheResume[] => {
  const newFiche = {
    id: ficheAction.id,
    collectivite_id: ficheAction.collectivite_id,
    modified_at: ficheAction.modified_at,
    // plans: ficheAction?.map(f => (f.id !== fiche.id ? f : fiche)),
    plans: [],
    titre: null,
    date_fin_provisoire: null,
    niveau_priorite: null,
    pilotes: null,
    statut: null,
  };
  return fichesResume.map(f => (f.id !== null ? f : newFiche));
/** Ordonne les fiches résumé par titre */
export const ficheResumeByTitle = (a: FicheResume, b: FicheResume) => {
  if (!a.titre) return -1;
  if (!b.titre) return 1;
  return naturalSort(a.titre, b.titre);
};
