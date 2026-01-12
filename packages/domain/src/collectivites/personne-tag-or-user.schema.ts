import { z } from 'zod';

export const personneTagOrUserSchema = z
  .object({
    nom: z.string(),
    tagId: z.number().nullish(),
    userId: z.string().nullish(),
    collectiviteId: z.number().nullish(),
  })
  .describe(
    'Une personne peut avoir soit un userId (si elle vient de la table dcp), soit un tagId (si elle vient de la table personne_tag)'
  );

export type PersonneTagOrUser = z.infer<typeof personneTagOrUserSchema>;

export const personneTagOrUserSchemaWithContacts =
  personneTagOrUserSchema.extend({
    prenom: z.string().optional().nullable(),
    nomFamille: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    telephone: z.string().optional().nullable(),
  });

export type PersonneTagOrUserWithContacts = z.infer<
  typeof personneTagOrUserSchemaWithContacts
>;

export const personneIdSchema = personneTagOrUserSchema.pick({
  tagId: true,
  userId: true,
});
export type PersonneId = z.infer<typeof personneIdSchema>;

export const personneSchema = personneIdSchema.extend({
  tagName: z.string().nullish(),
  userName: z.string().nullish(),
});
export type Personne = z.infer<typeof personneSchema>;
