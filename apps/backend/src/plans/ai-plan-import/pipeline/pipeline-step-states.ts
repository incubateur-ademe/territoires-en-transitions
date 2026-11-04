import { z } from 'zod';

const stepStateSchema = z.enum(['ok', 'skipped', 'pending']);

// Les étapes ajoutées après coup ont un défaut : les jobs déjà en base n'en
// ont pas la trace, et le routeur de statut valide ce qu'il lit.
export const stepStatesSchema = z.object({
  reading: stepStateSchema.default('skipped'),
  scouting: stepStateSchema.default('skipped'),
  extraction: stepStateSchema,
  hierarchy: stepStateSchema.default('skipped'),
  scoring: stepStateSchema,
  consolidation: stepStateSchema,
  enrichment: stepStateSchema,
  secteurs: stepStateSchema.default('skipped'),
  qualitativeReview: stepStateSchema,
});

export type StepState = z.infer<typeof stepStateSchema>;
export type StepStates = z.infer<typeof stepStatesSchema>;
export type StepName = keyof StepStates;
