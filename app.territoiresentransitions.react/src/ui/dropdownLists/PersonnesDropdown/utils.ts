import { Filtre } from '@tet/api/fiche_actions/fiche_resumes.list/domain/fetch_options.schema';
import { Personne } from 'ui/dropdownLists/PersonnesDropdown/usePersonneListe';

/**
 * Renvoie l'id en string d'un type Personne qui est soit un tag_id number ou un user_id string
 * @param personne
 * @returns id as string
 */
export const getPersonneStringId = (personne: Personne): string =>
  personne.tag_id ? personne.tag_id.toString() : personne.user_id!;

/** Renvoie un object avec les utilisateurs et les tags séparés pilotes */
export const splitPilotePersonnesAndUsers = (personnes: Personne[]) => {
  const personnePiloteIds: number[] = [];
  const utilisateurPiloteIds: string[] = [];
  personnes.forEach((p) => {
    if (p.tag_id) {
      personnePiloteIds.push(p.tag_id);
    }
    if (p.user_id) {
      utilisateurPiloteIds.push(p.user_id);
    }
  });
  return { personnePiloteIds, utilisateurPiloteIds };
};

/** Renvoie les valeurs de tous les pilotes d'après les filtres des fiches action résumées */
export const getPilotesValues = (filtreState: Filtre) => {
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
export const getReferentsValues = (filtreState: Filtre) => {
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
export const splitReferentPersonnesAndUsers = (personnes: Personne[]) => {
  const personneReferenteIds: number[] = [];
  const utilisateurReferentIds: string[] = [];

  personnes.forEach((p) => {
    if (p.tag_id) {
      personneReferenteIds.push(p.tag_id);
    }
    if (p.user_id) {
      utilisateurReferentIds.push(p.user_id);
    }
  });
  return { personneReferenteIds, utilisateurReferentIds };
};
