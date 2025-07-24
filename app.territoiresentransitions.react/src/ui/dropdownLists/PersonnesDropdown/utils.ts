import { Personne } from '@/api/collectivites';
import { PersonneTagOrUser } from '@/domain/collectivites';
import { ListFichesRequestFilters as Filtres } from '@/domain/plans/fiches';

/**
 * Renvoie l'id en string d'un type Personne qui est soit un tag_id number ou un user_id string
 * @param personne
 * @returns id as string
 */
export const getPersonneStringId = (personne: Personne): string =>
  personne.tagId ? personne.tagId.toString() : personne.userId!;

/** Renvoie un object avec les utilisateurs et les tags séparés pilotes */
export const splitPilotePersonnesAndUsers = (personnes: Personne[]) => {
  const personnePiloteIds: number[] = [];
  const utilisateurPiloteIds: string[] = [];
  personnes.forEach((p) => {
    if (p.tagId) {
      personnePiloteIds.push(p.tagId);
    }
    if (p.userId) {
      utilisateurPiloteIds.push(p.userId);
    }
  });
  return { personnePiloteIds, utilisateurPiloteIds };
};

/** Renvoie les valeurs de tous les pilotes d'après les filtres des fiches action résumées */
export const getPilotesValues = (
  filtreState: Pick<Filtres, 'utilisateurPiloteIds' | 'personnePiloteIds'>
) => {
  const pilotes = [];
  if (filtreState.utilisateurPiloteIds) {
    pilotes.push(...filtreState.utilisateurPiloteIds);
  }
  if (filtreState.personnePiloteIds) {
    pilotes.push(...filtreState.personnePiloteIds.map(String));
  }
  return pilotes;
};

/** Renvoie les valeurs de tous les référents d'après les filtres des fiches action résumées */
export const getReferentsValues = (
  filtreState: Pick<Filtres, 'utilisateurReferentIds' | 'personneReferenteIds'>
) => {
  const referents = [];
  if (filtreState.utilisateurReferentIds) {
    referents.push(...filtreState.utilisateurReferentIds);
  }
  if (filtreState.personneReferenteIds) {
    referents.push(...filtreState.personneReferenteIds.map(String));
  }
  return referents;
};

/** Renvoie un object avec les utilisateurs et les tags séparés référents */
export const splitReferentPersonnesAndUsers = (
  personnes: PersonneTagOrUser[]
) => {
  const personneReferenteIds: number[] = [];
  const utilisateurReferentIds: string[] = [];

  personnes.forEach((p) => {
    if (p.tagId) {
      personneReferenteIds.push(p.tagId);
    }
    if (p.userId) {
      utilisateurReferentIds.push(p.userId);
    }
  });
  return { personneReferenteIds, utilisateurReferentIds };
};
