export const statuts = [
  'À venir',
  'En cours',
  'Réalisé',
  'En retard',
  'En pause',
  'Abandonné',
] as const;

export type Statut = (typeof statuts)[number];

export type Fiche = Readonly<{
  titre: string;
  statut: Statut;
  pilote: string;
  /** Budget prévisionnel en euros, `null` quand il n'est pas renseigné. */
  budgetPrevisionnel: number | null;
  /** Montant dépensé en euros, `null` quand il n'est pas renseigné. */
  depense: number | null;
  /** Fin prévue, au format MM/AAAA. */
  finPrevue: string | null;
}>;

export const plan = {
  nom: 'Plan climat-air-énergie territorial 2024-2030',
} as const;

export const fiches: ReadonlyArray<Fiche> = [
  {
    titre: 'Rénovation énergétique des bâtiments communaux',
    statut: 'En cours',
    pilote: 'Direction du patrimoine',
    budgetPrevisionnel: 850000,
    depense: 312000,
    finPrevue: '12/2027',
  },
  {
    titre: 'Déploiement de bornes de recharge électrique',
    statut: 'À venir',
    pilote: 'Service mobilité',
    budgetPrevisionnel: 240000,
    depense: 0,
    finPrevue: '06/2026',
  },
  {
    titre: 'Plan vélo intercommunal',
    statut: 'En cours',
    pilote: 'Service mobilité',
    budgetPrevisionnel: 1200000,
    depense: 486500,
    finPrevue: '12/2028',
  },
  {
    titre: 'Panneaux photovoltaïques sur les écoles',
    statut: 'Réalisé',
    pilote: 'Direction du patrimoine',
    budgetPrevisionnel: 410000,
    depense: 398700,
    finPrevue: '09/2025',
  },
  {
    titre: 'Végétalisation des cours d’école',
    statut: 'En retard',
    pilote: 'Service espaces verts',
    budgetPrevisionnel: 180000,
    depense: 42000,
    finPrevue: '03/2026',
  },
  {
    titre: 'Sensibilisation des habitants à la sobriété énergétique',
    statut: 'En cours',
    pilote: 'Service communication',
    budgetPrevisionnel: 35000,
    depense: 12400,
    finPrevue: '12/2026',
  },
  {
    titre: 'Réseau de chaleur biomasse',
    statut: 'En pause',
    pilote: 'Direction de l’énergie',
    budgetPrevisionnel: 2100000,
    depense: 150000,
    finPrevue: '12/2029',
  },
  {
    titre: 'Extinction de l’éclairage public nocturne',
    statut: 'Réalisé',
    pilote: 'Service voirie',
    budgetPrevisionnel: 60000,
    depense: 58200,
    finPrevue: '01/2025',
  },
  {
    titre: 'Restauration collective : 50 % de produits durables',
    statut: 'À venir',
    pilote: 'Service restauration',
    budgetPrevisionnel: null,
    depense: null,
    finPrevue: '12/2026',
  },
  {
    titre: 'Covoiturage domicile-travail des agents',
    statut: 'Abandonné',
    pilote: 'Ressources humaines',
    budgetPrevisionnel: 15000,
    depense: 0,
    finPrevue: null,
  },
];
