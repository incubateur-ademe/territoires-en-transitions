import * as z from 'zod/mini';

export const indicateurSourceSchema = z.object({
  id: z.string(),
  libelle: z.string(),
  ordreAffichage: z.nullable(z.number()),
});

export type IndicateurSource = z.infer<typeof indicateurSourceSchema>;

export const indicateurSourceSchemaCreate = z.partial(indicateurSourceSchema, {
  ordreAffichage: true,
});

export type IndicateurSourceCreate = z.infer<
  typeof indicateurSourceSchemaCreate
>;
