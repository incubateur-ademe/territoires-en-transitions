import { secteurReglementaireEnumValues } from '@tet/domain/plans';
import { z } from 'zod';

export const upsertFicheSecteursInputSchema = z.object({
  ficheId: z.number().int().positive(),
  secteurs: z.array(z.enum(secteurReglementaireEnumValues)),
});

export type UpsertFicheSecteursInput = z.infer<
  typeof upsertFicheSecteursInputSchema
>;
