import { FicheListItem } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { naturalSort } from '@/app/utils/naturalSort';

/**
 * Formate un nouveau tag qui nécessite un type minimum collectivite_id, nom
 * @param inputValue
 * @param collectivite_id
 */
export const formatNewTag = (inputValue: string, collectivite_id: number) => ({
  collectivite_id,
  nom: inputValue,
});

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
}: FactoryArgs): FicheListItem => {
  return {
    id: tempId,
    collectiviteId,
    parentId: null,
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
    description: null,
    piliersEci: null,
    objectifs: null,
    cibles: null,
    indicateurs: null,
    mesures: null,
    etapes: null,
    fichesLiees: null,
    financements: null,
    budgetPrevisionnel: null,
    calendrier: null,
    notes: null,
    instanceGouvernance: null,
    participationCitoyenne: null,
    participationCitoyenneType: null,
    tempsDeMiseEnOeuvre: null,
    majTermine: null,
    ressources: null,
    createdAt: new Date().toISOString(),
    partenaires: [],
    referents: [],
    effetsAttendus: [],
    sousThematiques: [],
    thematiques: [],
    structures: [],
    libreTags: [],
    financeurs: [],
    docs: [],
    budgets: [],
    completion: {
      ficheId: tempId,
      fields: [],
      isCompleted: false,
    },
  };
};
