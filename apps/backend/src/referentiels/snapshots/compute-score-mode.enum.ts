/**
 * Pourrait être traduit par un boolean mais plus explicite comme ça. Plus évolutif aussi pour avoir des variantes de calcul de score.
 */
export enum ComputeScoreMode {
  RECALCUL = 'recalcul', // Mode par défaut, le score a été recalculé à partir des statuts et des réponses de personnalisation avec le nouveau moteur
  DEPUIS_SAUVEGARDE = 'depuis_sauvegarde', // Le score a été récupéré tel qu'il avait été sauvegardé dans la base de données par l'ancien moteur et mis dans la nouvelle structure de snapshots
}
