import type { FicheAction } from "../../../../generated/models/fiche_action";
import type { FicheActionCategorie } from "../../../../generated/models/fiche_action_categorie";
import * as R from "ramda"

const sortFiches = (fiches: FicheAction[]): FicheAction[] => fiches.sort((ficheA, ficheB) => ficheA.custom_id.localeCompare(ficheB.custom_id))

type CategorizedFiche = {categorie: FicheActionCategorie, fiches: FicheAction[]}

const findFicheCategorie = (fiche: FicheAction, categories: FicheActionCategorie[]): FicheActionCategorie | undefined => categories.find((categorie) => categorie.fiche_actions_uids.includes(fiche.uid))

export const categorizeAndSortFiches = (fiches: FicheAction[], categories: FicheActionCategorie[], defaultCategorie: FicheActionCategorie): CategorizedFiche[] => {
  const byCategorieUid = R.groupBy(function(fiche: FicheAction) {
    const categorie =  findFicheCategorie(fiche, categories) || defaultCategorie
    return categorie.uid
  });
  const asCategorizedFiche = R.mapObjIndexed((fiches: FicheAction[], categorieUid: string) => ({
    fiches: fiches,
    categorie: [...categories, defaultCategorie].find((categorie) => categorie.uid == categorieUid),
  }))

  const fichesByCategorieUid  = byCategorieUid(fiches);
  const categorizedFiches = R.values(asCategorizedFiche(fichesByCategorieUid))
  const sortedCategorizedFiches = categorizedFiches.map(categorizedFiche => ({...categorizedFiche, fiches: sortFiches(categorizedFiche.fiches)}))
  
  return sortedCategorizedFiches
}

