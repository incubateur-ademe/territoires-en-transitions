import { statutEnumValues } from '@tet/domain/plans';
import { z } from 'zod';

const enrichmentStatutValues = ['', ...statutEnumValues] as const;

const enrichmentEntrySchema = z.object({
  index: z.number().int().min(0),
  description: z.string(),
  personne_pilote: z.string(),
  statut: z.enum(enrichmentStatutValues),
  date_debut: z.string(),
  date_fin: z.string(),
});

export const enrichmentResponseSchema = z.array(enrichmentEntrySchema);

export type EnrichmentEntry = z.output<typeof enrichmentEntrySchema>;
