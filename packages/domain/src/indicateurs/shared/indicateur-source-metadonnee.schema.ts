import * as z from 'zod/mini';

export const indicateurSourceMetadonneeSchema = z.object({
  id: z.number(),
  sourceId: z.string(),
  dateVersion: z.string(),
  nomDonnees: z.nullable(z.string()),
  diffuseur: z.nullable(z.string()),
  producteur: z.nullable(z.string()),
  methodologie: z.nullable(z.string()),
  limites: z.nullable(z.string()),
});

export type IndicateurSourceMetadonnee = z.infer<
  typeof indicateurSourceMetadonneeSchema
>;

export const indicateurSourceMetadonneeSchemaCreate = z.partial(
  indicateurSourceMetadonneeSchema,
  {
    id: true,
    nomDonnees: true,
    diffuseur: true,
    producteur: true,
    methodologie: true,
    limites: true,
  }
);

export type IndicateurSourceMetadonneeCreate = z.infer<
  typeof indicateurSourceMetadonneeSchemaCreate
>;
