import * as Utils from '../_shared/exportUtils.ts';

// libellés de toutes les colonnes
export const COLUMN_LABELS = [
  '', // identifiant action
  '', // intitulé action
  'Phase',
  'Potentiel max',
  ...Utils.SCORE_HEADER_LABELS,
  ...Utils.SCORE_HEADER_LABELS,
  "Champs de précision de l'état d'avancement",
  'Documents liés',
];

// index (base 1) de toutes les colonnes
export const COL_INDEX = {
  arbo: 1,
  intitule: 2,
  phase: 3,
  points_max_referentiel: 4,
  pre_audit: {
    points_max_personnalises: 5,
    points_realises: 6,
    score_realise: 7,
    points_programmes: 8,
    score_programme: 9,
    statut: 10,
  },
  courant: {
    points_max_personnalises: 11,
    points_realises: 12,
    score_realise: 13,
    points_programmes: 14,
    score_programme: 15,
    statut: 16,
  },
  commentaires: 17,
  docs: 18,
};
