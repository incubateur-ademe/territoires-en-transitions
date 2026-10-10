export type ValeursMoyenneDTO = {
  indicateurId: number;
  typeCollectivite: string;
  valeurs: {
    sourceLibelle: string | null;
    dateValeur: string;
    valeur: number;
  }[];
};
