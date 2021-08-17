import type {FicheAction} from 'generated/models/fiche_action';
import type {FicheActionCategorie} from 'generated/models/fiche_action_categorie';
import {compareIndexes} from 'utils';
import * as R from 'ramda';

export const sortFiches = (fiches: FicheAction[]): FicheAction[] =>
  fiches.sort((ficheA, ficheB) => {
    return compareIndexes(ficheA.custom_id, ficheB.custom_id);
  });

export type CategorizedFiche = {
  fiches: FicheAction[];
  categorie: FicheActionCategorie;
};

const findFicheCategorie = (
  fiche: FicheAction,
  categories: FicheActionCategorie[]
): FicheActionCategorie | undefined =>
  categories.find(categorie =>
    categorie.fiche_actions_uids.includes(fiche.uid)
  );

export const categorizeAndSortFiches = (
  fiches: FicheAction[],
  categories: FicheActionCategorie[],
  defaultCategorie: FicheActionCategorie
): CategorizedFiche[] => {
  const byCategorieUid = R.groupBy((fiche: FicheAction) => {
    const categorie = findFicheCategorie(fiche, categories) || defaultCategorie;
    return categorie.uid;
  });
  const asCategorizedFiche = R.mapObjIndexed(
    (fiches: FicheAction[], categorieUid: string) => ({
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
    FicheAction[],
    Record<string, FicheAction[]>,
    Record<string, CategorizedFiche>,
    CategorizedFiche[],
    CategorizedFiche[]
  >(
    byCategorieUid,
    asCategorizedFiche,
    R.values,
    sortCategorizedFiches
  )(fiches);
  return sortedCategorizedFiches;
};
