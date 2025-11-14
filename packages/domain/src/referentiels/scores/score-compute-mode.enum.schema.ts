import * as z from 'zod/mini';

export const ScoreComputeModeEnum = {
  RECALCUL: 'recalcul', // Mode par défaut, le score a été recalculé à partir des statuts et des réponses de personnalisation avec le nouveau moteur
  DEPUIS_SAUVEGARDE: 'depuis_sauvegarde', // Le score a été récupéré tel qu'il avait été sauvegardé dans la base de données par l'ancien moteur et mis dans la nouvelle structure de snapshots
} as const;

export const scoreComnputeModeEnumSchema = z.enum(ScoreComputeModeEnum);

export type ScoreComputeMode =
  (typeof ScoreComputeModeEnum)[keyof typeof ScoreComputeModeEnum];
