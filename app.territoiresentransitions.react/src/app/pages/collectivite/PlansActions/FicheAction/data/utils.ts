import { naturalSort } from '@/app/utils/naturalSort';
import { FicheResume } from '@/domain/plans/fiches';

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
 * Renvoie "Sans titre" si le string est undefined ou null
 * @deprecated
 */
export const generateTitle = (title?: string | null) => title || 'Sans titre';

/** Ordonne les fiches par titre */
export function sortFichesResume<T extends { titre: string | null }>(
  fiches: T[]
): T[] {
  return fiches.sort((a: T, b: T) => {
    if (!a.titre) return -1;
    if (!b.titre) return 1;
    return naturalSort(a.titre, b.titre);
  });
}

type FactoryArgs = {
  tempId: number;
  collectiviteId: number;
  axeFichesIds?: number[] | null;
  axeId?: number;
};

export const ficheResumeFactory = ({
  tempId,
  collectiviteId,
  axeId,
}: FactoryArgs): FicheResume => {

  return {
    id: tempId,
    collectiviteId,
    collectiviteNom: null,
    dateDebut: null,
    dateFin: null,
    ameliorationContinue: null,
    priorite: null,
    plans: null,
    statut: null,
    titre: '',
    restreint: false,
    services: [],
    pilotes: [],
    modifiedAt: new Date().toISOString(),
    sharedWithCollectivites: [],
    axes: axeId
      ? [{ id: axeId, collectiviteId, nom: '', parentId: null, planId: null }]
      : null,
  };
};

