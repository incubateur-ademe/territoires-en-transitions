/**
 * Configuration des exports
 */
const common = {
  // les cellules du cartouche d'information
  info_cells: {
    collectivite: 'A1',
    exportedAt: 'D2',
  },
  // les colonnes du tableau de données
  data_cols: {
    identifiant: 'A',
    nom: 'B',
    phase: 'C',
    points_max_referentiel: 'D',
    points_max_personnalises: 'E',
    points_realises: 'F',
    score_realise: 'G',
    points_programmes: 'H',
    score_programme: 'I',
    statut: 'J',
    commentaire: 'K',
  },
};

export type Config = typeof cae;

// configuration de base pour CAE
const cae = {
  ...common,
  // numéro de la ligne "total" du tableau de données
  total_row: 7,
  // numéro de la 1ère ligne "action"
  first_data_row: 8,
};

// configuration ECi
export const eci: Config = {
  ...common,
  // numéro de la ligne "total" du tableau de données
  total_row: 6,
  // numéro de la 1ère ligne "action"
  first_data_row: 7,
};

export const configParReferentiel: Record<string, Config | null> = {
  cae,
  eci,
};
