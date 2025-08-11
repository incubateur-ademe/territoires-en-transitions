export const MAX_NUMBER_OF_CARDS_PER_PAGE = 16;

export const getFilterProperties = (args: {
  nom?: string | string[];
  typesPlan: (string | number)[];
}): {
  nom: string;
  typesPlan: number[];
  nbCards: number;
} => {
  return {
    nom: Array.isArray(args.nom) ? args.nom[0] || '' : args.nom || '',
    // TODO: Supprimer ce cast manuel quand on utilisera la lib `nuqs`
    // qui gérera automatiquement les cast de query params
    typesPlan: args.typesPlan.map((type) => Number(type)),
    nbCards: MAX_NUMBER_OF_CARDS_PER_PAGE,
  };
};
