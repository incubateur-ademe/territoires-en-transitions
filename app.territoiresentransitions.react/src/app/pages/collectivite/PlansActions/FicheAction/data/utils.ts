import {
  FicheAction,
  FicheActionInsert,
  FicheResume,
} from '@tet/api/plan-actions';
import { naturalSort } from 'utils/naturalSort';

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
  collectiviteId: number;
  axeFichesIds?: number[] | null;
  axeId?: number;
};

export const ficheResumeFactory = ({
  collectiviteId,
  axeFichesIds,
  axeId,
}: FactoryArgs): FicheResume => {
  const lowerId = axeFichesIds
    ? axeFichesIds.reduce((a, b) => (a < b ? a : b))
    : 0;
  const tempId = Math.min(0, lowerId || 0) - 1;
  return {
    id: tempId,
    collectiviteId,
    dateFinProvisoire: null,
    ameliorationContinue: null,
    niveauPriorite: null,
    plans: axeId ? [{ id: axeId, collectiviteId }] : null,
    statut: null,
    titre: '',
    restreint: false,
    services: [],
  };
};

/** Transforme une fiche action en fiche résumée */
export const ficheActionToResume = (fiche: FicheAction): FicheResume => ({
  id: fiche.id!,
  collectiviteId: fiche.collectiviteId!,
  dateFinProvisoire: fiche.dateFinProvisoire,
  ameliorationContinue: fiche.ameliorationContinue,
  modifiedAt: fiche.modifiedAt!,
  niveauPriorite: fiche.niveauPriorite,
  pilotes: fiche.pilotes,
  plans: fiche.axes?.filter((axe) => axe.parent === null) ?? null,
  statut: fiche.statut,
  titre: fiche.titre!,
  restreint: fiche.restreint,
  // services: fiche.services,
});
