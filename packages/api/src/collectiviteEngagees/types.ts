export type FilterPlan = {
  typesPlan: number[];
};
export type FilterCollectivite = {
  nom: string;
  regions: string[];
  departments: string[];
  typesCollectivite: string[];
  population: string[];
};
export type Filters = {
  referentiel: string[];
  niveauDeLabellisation: string[];
  realiseCourant: string[];
  tauxDeRemplissage: string[];
  trierPar?: string[];
  page?: number;
} & FilterCollectivite &
  FilterPlan;

export type RecherchesContact = {
  prenom: string;
  nom: string;
  fonction?: string;
  detailFonction?: string;
  telephone?: string;
  email: string;
};

export type RecherchesCollectivite = {
  collectiviteId: number;
  collectiviteNom: string;
  nbIndicateurs: number;
  nbPlans: number;
  etoilesEci: number;
  etoilesCae: number;
  contacts: RecherchesContact[];
};

export type RecherchesReferentiel = {
  collectiviteId: number;
  collectiviteNom: string;
  collectiviteType: string;
  etoilesCae: number;
  scoreFaitCae: number;
  scoreProgrammeCae: number;
  etoilesEci: number;
  scoreFaitEci: number;
  scoreProgrammeEci: number;
  contacts: RecherchesContact[];
};

export type RecherchesPlan = {
  collectiviteId: number;
  collectiviteNom: string;
  planId: number;
  planNom: string;
  planType?: string;
  contacts: RecherchesContact[];
};
