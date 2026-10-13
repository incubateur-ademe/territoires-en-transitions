export type RecetteCollectivite = {
  tecCollectiviteId: number;
  collectiviteId: number | null;
  nom: string;
  siren: string | null;
  population: number | null;
  nomTet: string | null;
  typeTet: string | null;
  natureTet: string | null;
  region: string | null;
  departement: string | null;
  dossiers: {
    tecDossierId: number;
    demarcheId: number | null;
    copieId: number | null;
  }[];
};
