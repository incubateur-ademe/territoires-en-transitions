/** constante pour gérer la sélection de tous les filtres */
export const ITEM_ALL = 'tous';

/** vérifie si ITEM_ALL est présent dans la liste de valeurs */
export const getIsAllSelected = (values: string[]) =>
  !values.length || values.includes(ITEM_ALL);
