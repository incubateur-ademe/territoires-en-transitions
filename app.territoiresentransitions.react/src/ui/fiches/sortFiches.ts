import type {FicheActionCategorie} from 'types/fiche_action_categorie';
import {compareIndexes} from 'utils/compareIndexes';
import * as R from 'ramda';
import {FicheActionRead} from 'generated/dataLayer/fiche_action_read';

export const sortFiches = (fiches: FicheActionRead[]): FicheActionRead[] =>
  fiches
    .sort((ficheA, ficheB) => {
      return compareIndexes(ficheA.titre, ficheB.titre);
    })
    .sort((ficheA, ficheB) => {
      return compareIndexes(ficheA.numerotation, ficheB.numerotation);
    });

export type CategorizedFiche = {
  fiches: FicheActionRead[];
  categorie: FicheActionCategorie;
};

const findFicheCategorie = (
  fiche: FicheActionRead,
  categories: FicheActionCategorie[]
): FicheActionCategorie | undefined =>
  categories.find(categorie =>
    categorie.fiche_actions_uids.includes(fiche.uid)
  );

export const categorizeAndSortFiches = (
  fiches: FicheActionRead[],
  categories: FicheActionCategorie[],
  defaultCategorie: FicheActionCategorie
): CategorizedFiche[] => {
  const byCategorieUid = R.groupBy((fiche: FicheActionRead) => {
    const categorie = findFicheCategorie(fiche, categories) || defaultCategorie;
    return categorie.uid;
  });
  const asCategorizedFiche = R.mapObjIndexed(
    (fiches: FicheActionRead[], categorieUid: string) => ({
      fiches: fiches,
      categorie: [...categories, defaultCategorie].find(
        categorie => categorie.uid === categorieUid
      )!,
    })
  );

  const sortCategorizedFiches = R.map((categorizedFiche: CategorizedFiche) => ({
    ...categorizedFiche,
    fiches: sortFiches(categorizedFiche.fiches),
  }));

  const sortedCategorizedFiches = R.pipe<
    FicheActionRead[],
    Record<string, FicheActionRead[]>,
    Record<string, CategorizedFiche>,
    CategorizedFiche[],
    CategorizedFiche[]
  >(
    // @ts-ignore : en attendant d'enlever ramda et faire une v2 du plan d'actions
    byCategorieUid,
    asCategorizedFiche,
    R.values,
    sortCategorizedFiches
    // @ts-ignore
  )(fiches);
  // @ts-ignore
  return sortedCategorizedFiches;
};
