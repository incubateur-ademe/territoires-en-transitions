export type FicheBudget = Readonly<{
  nom: string;
  pilote: string;
  budget: number;
  /** Part du budget consommée, de 0 à 1. */
  consomme: number;
  statut: 'En cours' | 'À venir' | 'Réalisé';
}>;

export const fiches: ReadonlyArray<FicheBudget> = [
  {
    nom: 'Rénovation énergétique des écoles',
    pilote: 'Service patrimoine',
    budget: 420000,
    consomme: 0.62,
    statut: 'En cours',
  },
  {
    nom: 'Pistes cyclables du centre-bourg',
    pilote: 'Direction mobilités',
    budget: 180000,
    consomme: 0.15,
    statut: 'À venir',
  },
  {
    nom: 'Cantine 100 % bio et locale',
    pilote: 'Service restauration',
    budget: 95000,
    consomme: 1,
    statut: 'Réalisé',
  },
];

export const indicateurs = [
  { label: 'Budget total', valeur: 695000, unite: 'euros' },
  { label: 'Consommé', valeur: 442400, unite: 'euros' },
  { label: 'Fiches financées', valeur: 3, unite: 'nombre' },
] as const;
