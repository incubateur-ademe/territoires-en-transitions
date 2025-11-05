import * as z from 'zod/mini';

export const indicateurDefinitionSchema = z.object({
  id: z.number(),
  version: z.string(),
  groupementId: z.nullable(z.number()),
  collectiviteId: z.nullable(z.number()),
  identifiantReferentiel: z.nullable(z.string()),
  titre: z.string(),
  titreLong: z.nullable(z.string()),
  titreCourt: z.nullable(z.string()),
  description: z.nullable(z.string()),
  unite: z.string(),
  precision: z.number(),
  borneMin: z.nullable(z.number()),
  borneMax: z.nullable(z.number()),
  participationScore: z.boolean(),
  sansValeurUtilisateur: z.boolean(),
  valeurCalcule: z.nullable(z.string()),
  exprCible: z.nullable(z.string()),
  exprSeuil: z.nullable(z.string()),
  libelleCibleSeuil: z.nullable(z.string()),
  createdAt: z.string(),
  modifiedAt: z.string(),
  createdBy: z.nullable(z.uuid()),
  modifiedBy: z.nullable(z.uuid()),
});

export type IndicateurDefinition = z.infer<typeof indicateurDefinitionSchema>;

export const indicateurDefinitionSchemaCreate = z.partial(
  indicateurDefinitionSchema,
  {
    groupementId: true,
    collectiviteId: true,
    identifiantReferentiel: true,
    titreLong: true,
    titreCourt: true,
    description: true,
    borneMin: true,
    borneMax: true,
    valeurCalcule: true,
    exprCible: true,
    exprSeuil: true,
    libelleCibleSeuil: true,
    createdAt: true,
    modifiedAt: true,
    createdBy: true,
    modifiedBy: true,
  }
);

export type IndicateurDefinitionCreate = z.infer<
  typeof indicateurDefinitionSchemaCreate
>;

export const indicateurDefinitionSchemaTiny = z.pick(
  indicateurDefinitionSchema,
  {
    id: true,
    identifiantReferentiel: true,
    titre: true,
    titreLong: true,
    description: true,
    unite: true,
    borneMin: true,
    borneMax: true,
  }
);

export type IndicateurDefinitionTiny = z.infer<
  typeof indicateurDefinitionSchemaTiny
>;

export type IndicateurDefinitionAvecEnfants = IndicateurDefinition & {
  enfants: IndicateurDefinition[] | null;
};
