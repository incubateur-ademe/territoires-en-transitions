import * as z from 'zod/mini';
import {
  indicateurDefinitionSchema,
  indicateurDefinitionSchemaTiny,
} from '../definitions/indicateur-definition.schema';
import { indicateurSourceMetadonneeSchema } from '../shared/indicateur-source-metadonnee.schema';
import { indicateurSourceSchema } from '../shared/indicateur-source.schema';

export const indicateurValeurSchema = z.object({
  id: z.number(),
  collectiviteId: z.number(),
  indicateurId: z.number(),
  dateValeur: z.string(),
  metadonneeId: z.nullable(z.number()),
  resultat: z.nullable(z.number()),
  resultatCommentaire: z.nullable(z.string()),
  objectif: z.nullable(z.number()),
  objectifCommentaire: z.nullable(z.string()),
  estimation: z.nullable(z.number()),
  calculAuto: z.nullable(z.boolean()),
  calculAutoIdentifiantsManquants: z.nullable(z.array(z.string())),
  createdAt: z.string(),
  modifiedAt: z.string(),
  createdBy: z.nullable(z.uuid()),
  modifiedBy: z.nullable(z.uuid()),
});

export type IndicateurValeur = z.infer<typeof indicateurValeurSchema>;

export const indicateurValeurSchemaCreate = z.partial(indicateurValeurSchema, {
  id: true,
  metadonneeId: true,
  resultat: true,
  resultatCommentaire: true,
  objectif: true,
  objectifCommentaire: true,
  estimation: true,
  calculAuto: true,
  calculAutoIdentifiantsManquants: true,
  createdAt: true,
  modifiedAt: true,
  createdBy: true,
  modifiedBy: true,
});

export type IndicateurValeurCreate = z.infer<
  typeof indicateurValeurSchemaCreate
>;

export const indicateurValeurGroupeeSchema = z.object({
  ...z.pick(indicateurValeurSchema, {
    id: true,
    collectiviteId: true,
    dateValeur: true,
  }).shape,

  ...z.pick(indicateurValeurSchemaCreate, {
    resultat: true,
    resultatCommentaire: true,
    objectif: true,
    objectifCommentaire: true,
    metadonneeId: true,
    calculAuto: true,
    calculAutoIdentifiantsManquants: true,
  }).shape,

  confidentiel: z.nullish(z.boolean()),
});

export type IndicateurValeurGroupee = z.infer<
  typeof indicateurValeurGroupeeSchema
>;

export const indicateurAvecValeursSchema = z.object({
  definition: indicateurDefinitionSchemaTiny,
  valeurs: z.array(indicateurValeurGroupeeSchema),
});

export const indicateurValeursGroupeeParSourceSchema = z.object({
  source: z.string(),
  metadonnees: z.array(indicateurSourceMetadonneeSchema),
  valeurs: z.array(indicateurValeurGroupeeSchema),
  ordreAffichage: indicateurSourceSchema.shape.ordreAffichage,
  libelle: indicateurSourceSchema.shape.libelle,
});

export const indicateurAvecValeursParSourceSchema = z.object({
  definition: indicateurDefinitionSchema,
  sources: z.record(z.string(), indicateurValeursGroupeeParSourceSchema),
});

export type IndicateurValeurWithIdentifiant = IndicateurValeur & {
  indicateurIdentifiant?: string | null;
  sourceId?: string | null;
};
export type IndicateurAvecValeurs = z.infer<typeof indicateurAvecValeursSchema>;
export type IndicateurValeursGroupeeParSource = z.infer<
  typeof indicateurValeursGroupeeParSourceSchema
>;
export type IndicateurAvecValeursParSource = z.infer<
  typeof indicateurAvecValeursParSourceSchema
>;
