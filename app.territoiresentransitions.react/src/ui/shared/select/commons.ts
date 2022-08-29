/** constante pour gérer la sélection de tous les filtres */
export const ITEM_ALL = 'tous';

/** vérifie si ITEM_ALL est présent dans la liste de valeurs */
export const getIsAllSelected = (values: string[]) =>
  !values.length || values.indexOf(ITEM_ALL) !== -1;

/* Class génériques */
export const buttonDisplayedClassname =
  'flex items-center w-full p-2 text-left text-sm';
export const buttonDisplayedPlaceholderClassname =
  'mr-auto text-gray-500 italic';
export const buttonDisplayedIconClassname =
  'fr-fi-arrow-down-s-line mt-1 ml-1 scale-90';
export const optionButtonClassname =
  'flex items-center w-full p-2 text-left text-sm';
export const optionCheckMarkClassname = 'block fr-fi-check-line scale-75';
