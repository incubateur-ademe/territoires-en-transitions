// paramètres d'un appel `progression_snbc(...)` ou `reduction(...)`
export type ProgressionParams = {
  token: 'progression_snbc' | 'reduction';
  // année de départ résolue (2015 par défaut pour `progression_snbc`)
  anneeDepart: number;
  // uniquement pour `reduction`
  anneeCible?: number;
  reductionCible?: number;
};

export type ReferencedIndicateur = {
  identifiant: string;
  optional: boolean;
  sources?: string[];
  tokens: string[];
  progressions?: ProgressionParams[];
};
