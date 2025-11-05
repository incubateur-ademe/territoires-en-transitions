import { z } from 'zod/mini';
import { etoileEnumSchema } from './labellisation-etoile.enum.schema';

export const labellisationEtoileDefinitionSchema = z.object({
  etoile: etoileEnumSchema,
  prochaineEtoile: z.nullable(z.number()),
  longLabel: z.string(),
  shortLabel: z.string(),
  minRealisePercentage: z.number(),
  minRealiseScore: z.number(),
});

export type LabellisationEtoileDefinition = z.infer<
  typeof labellisationEtoileDefinitionSchema
>;
