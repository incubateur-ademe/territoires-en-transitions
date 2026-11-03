import * as z from 'zod/mini';
import { dcpSchema } from './dcp.schema';

export const authorSchema = z.object({
  id: dcpSchema.shape.id,
  nom: dcpSchema.shape.nom,
  prenom: dcpSchema.shape.prenom,
});

export type Author = z.infer<typeof authorSchema>;
