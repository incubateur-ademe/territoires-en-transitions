import { z } from 'zod';

export const personneTagOrUserSchema = z
  .object({
    nom: z.string(),
    tagId: z.number().nullish(),
    userId: z.string().nullish(),
    collectiviteId: z.number().nullish(),
  })
  .describe(
    'Une personne peut avoir soit un urserId (si elle vient de la table dcp), soit un tagId (si elle vient de la table personne_tag)'
  );

export type PersonneTagOrUser = z.infer<typeof personneTagOrUserSchema>;
