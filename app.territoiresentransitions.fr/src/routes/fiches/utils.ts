import type { FicheAction } from "$generated/models/fiche_action";
import type { FicheActionCategorie } from "$generated/models/fiche_action_categorie";
import * as R from "ramda"

const stringToNumberArray = (stringIndexes: string) => stringIndexes.split(/[^a-zA-Z0-9']/).map(char=> /^-?\d+$/.test(char) ? Number(char) : char.charCodeAt(0));

export const sortFiches = (fiches: FicheAction[]): FicheAction[] => fiches.sort((ficheA, ficheB) => {
  const ficheAIndexes = stringToNumberArray(ficheA.custom_id)
  const ficheBIndexes = stringToNumberArray(ficheB.custom_id)

  if (ficheAIndexes == ficheBIndexes) return 0

  for (let index = 0; index < Math.max(ficheAIndexes.length, ficheBIndexes.length) ; index++) {
    const ficheAIndex = ficheAIndexes[index];
    const ficheBIndex = ficheBIndexes[index];
    if (ficheBIndex === undefined) return 1 // fiche A is parent of fiche B
    if (ficheAIndex === undefined) return -1 // fiche B is parent of fiche A
    if (ficheAIndex !=  ficheBIndex) return ficheAIndex > ficheBIndex ? 1 : -1 // siblings comparison
  }

})

export type CategorizedFiche = {fiches: FicheAction[], categorie: FicheActionCategorie}

const findFicheCategorie = (fiche: FicheAction, categories: FicheActionCategorie[]): FicheActionCategorie | undefined => categories.find((categorie) => categorie.fiche_actions_uids.includes(fiche.uid))

export const categorizeAndSortFiches = (fiches: FicheAction[], categories: FicheActionCategorie[], defaultCategorie: FicheActionCategorie): CategorizedFiche[] => {
  const byCategorieUid = R.groupBy(function(fiche: FicheAction) {
    const categorie =  findFicheCategorie(fiche, categories) || defaultCategorie
    return categorie.uid
  });
  const asCategorizedFiche = R.mapObjIndexed((fiches: FicheAction[], categorieUid: string) => ({
    fiches: fiches,
    categorie: [...categories, defaultCategorie].find((categorie) => categorie.uid == categorieUid),
  }))

  const sortCategorizedFiches = R.map((categorizedFiche: CategorizedFiche) => ({...categorizedFiche, fiches: sortFiches(categorizedFiche.fiches)}))
  
  const sortedCategorizedFiches= R.pipe<FicheAction[], 
                    Record<string, FicheAction[]>, 
                    Record<string, CategorizedFiche>,
                    CategorizedFiche[],
                    CategorizedFiche[]
                    >(byCategorieUid, 
                      asCategorizedFiche, 
                      R.values, 
                      sortCategorizedFiches)
                    (fiches)
  return sortedCategorizedFiches
}