import * as z from 'zod/mini';
import { lienSchema } from './document-lien.schema';

export const preuveBaseSchema = z.object({
  id: z.number(),
  collectiviteId: z.number(),
  fichierId: z.nullable(z.number()),
  url: z.nullable(z.string()),
  titre: z.nullable(z.string()),
  commentaire: z.nullable(z.string()),
  modifiedAt: z.iso.datetime(),
  modifiedBy: z.nullable(z.uuid()),
  lien: z.nullable(lienSchema),
});

export type PreuveBase = z.infer<typeof preuveBaseSchema>;
