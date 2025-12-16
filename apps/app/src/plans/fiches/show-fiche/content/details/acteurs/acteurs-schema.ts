import { Cible } from '@tet/domain/plans';
import { z } from 'zod';

export const acteursFormSchema = z.object({
  services: z.array(z.any()).nullable(),
  structures: z.array(z.any()).nullable(),
  referents: z.array(z.any()).nullable(),
  partenaires: z.array(z.any()).nullable(),
  cibles: z.array(z.custom<Cible>()).nullable(),
  instanceGouvernance: z.string().nullable(),
  participationCitoyenne: z.string().nullable(),
});

export type ActeursFormValues = z.infer<typeof acteursFormSchema>;
