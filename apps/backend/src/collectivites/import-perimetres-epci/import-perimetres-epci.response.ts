export type ImportPerimetresEpciResponse = {
  /** Lignes de composition communale chargées. */
  communes: number;
  /** EPCI à fiscalité propre distincts dans la source. */
  epci: number;
  /** Périmètres secondaires écrits par le calcul (départements + régions). */
  perimetres: number;
  /** D'où la source a été lue. */
  origine: 'datagouv' | 'fichier-committe';
};
