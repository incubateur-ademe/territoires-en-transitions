/**
 * Pourrait être traduit par un boolean mais plus explicite comme ça. Plus évolutif aussi pour avoir des variantes de calcul de score.
 */
export enum ComputeScoreMode {
  RECALCUL = 'recalcul', // Mode par défaut, le score est recalculé à partir des statuts et des réponses de personnalisation
  DEPUIS_SAUVEGARDE = 'depuis_sauvegarde', // Le score est récupéré tel qu'il a été sauvegardé dans la base de données
}
