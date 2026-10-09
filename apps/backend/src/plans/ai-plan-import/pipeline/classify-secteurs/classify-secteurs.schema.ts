import { secteurReglementaireEnumValues } from '@tet/domain/plans';
import { z } from 'zod';

const secteursEntrySchema = z.object({
  index: z.number().int(),
  secteurs: z.array(z.enum(secteurReglementaireEnumValues)),
  justification: z.string(),
});

export const secteursResponseSchema = z.array(secteursEntrySchema);

export type SecteursEntry = z.output<typeof secteursEntrySchema>;
