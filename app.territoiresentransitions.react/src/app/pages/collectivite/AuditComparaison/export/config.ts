/**
 * Configuration des exports
 */
const common = {
  // les cellules du cartouche d'information
  info_cells: {
    collectivite: 'A1',
    auditeurs: 'B2',
    exportedAt: 'B3',
  },
  // numéro de la ligne "total" du tableau de données
  total_row: 8,
  // numéro de la 1ère ligne "action"
  first_data_row: 9,
};

export type Config = typeof cae;

// configuration de base pour CAE
const cae = {
  ...common,

  // les colonnes du tableau de données
  data_cols: {
    identifiant: 'A',
    nom: 'B',
    phase: 'C',
    points_max_referentiel: 'D',
    pre_audit: {
      points_max_personnalises: 'E',
      points_realises: 'F',
      score_realise: 'G',
      points_programmes: 'H',
      score_programme: 'I',
      statut: 'J',
    },
    courant: {
      points_max_personnalises: 'K',
      points_realises: 'L',
      score_realise: 'M',
      points_programmes: 'N',
      score_programme: 'O',
      statut: 'P',
    },
    commentaire: 'Q',
    documents: 'R',
  },
};

// configuration ECi
export const eci: Config = {
  ...common,

  // les colonnes du tableau de données
  data_cols: {
    identifiant: 'A',
    nom: 'B',
    phase: '', // pas de colonne 'phase' pour ECi
    points_max_referentiel: 'C',
    pre_audit: {
      points_max_personnalises: 'D',
      points_realises: 'E',
      score_realise: 'F',
      points_programmes: 'G',
      score_programme: 'H',
      statut: 'I',
    },
    courant: {
      points_max_personnalises: 'J',
      points_realises: 'K',
      score_realise: 'L',
      points_programmes: 'M',
      score_programme: 'N',
      statut: 'O',
    },
    commentaire: 'P',
    documents: 'Q',
  },
};

export const configParReferentiel: Record<string, Config | null> = {
  cae,
  eci,
};
