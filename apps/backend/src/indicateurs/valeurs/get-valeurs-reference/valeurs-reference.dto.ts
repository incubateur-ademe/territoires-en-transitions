export type ValeursReferenceDTO = {
  indicateurId: number;
  unite: string;
  identifiantReferentiel: string | null;
  libelle: string | null;
  cible: number | null;
  seuil: number | null;
  objectifs:
    | {
        valeur: number;
        dateValeur: string;
      }[]
    | null;
  drom: boolean | null;
};
