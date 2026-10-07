/**
 * Qui a écrit un périmètre secondaire.
 *
 * Ce n'est pas une trace décorative : le calcul des périmètres des EPCI se
 * rejoue périodiquement depuis la composition communale Banatic, et il doit
 * pouvoir remplacer **ses** lignes sans emporter celles de l'import des services
 * de l'État, qui viennent d'un classeur et ne se recalculent pas.
 */
export const perimetreSecondaireSourceEnum = {
  IMPORT_SERVICE_ETAT: 'import_service_etat',
  BANATIC: 'banatic',
} as const;

export type PerimetreSecondaireSource =
  (typeof perimetreSecondaireSourceEnum)[keyof typeof perimetreSecondaireSourceEnum];
