import {naturalSort} from 'utils/naturalSort';
import {FicheAction, FicheResume} from './types';

/**
 * Formate un nouveau tag qui nécessite un type minimum collectivite_id, nom
 * @param inputValue
 * @param collectivite_id
 */
export const formatNewTag = (inputValue: string, collectivite_id: number) => ({
  collectivite_id,
  nom: inputValue,
});

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

/** Transforme une fiche action en fiche résumée */
export const ficheActionToResume = (fiche: FicheAction): FicheResume => ({
  id: fiche.id,
  collectivite_id: fiche.collectivite_id,
  date_fin_provisoire: fiche.date_fin_provisoire,
  amelioration_continue: fiche.amelioration_continue,
  modified_at: fiche.modified_at,
  niveau_priorite: fiche.niveau_priorite,
  pilotes: fiche.pilotes,
  plans: fiche.axes?.filter(axe => axe.parent === null) ?? null,
  statut: fiche.statut,
  titre: fiche.titre,
  restreint: fiche.restreint,
});
