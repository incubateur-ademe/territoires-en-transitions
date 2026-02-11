import z from 'zod';
import { collectiviteNatureEnumSchema } from './collectivite-banatic-type.enum';
import { collectiviteTypeEnumSchema } from './collectivite-type.enum';

export const collectiviteSchema = z.object({
  id: z.number(),
  modifiedAt: z.string(),
  createdAt: z.string(),
  accesRestreint: z.boolean().nullable(),
  nom: z.string(),
  type: collectiviteTypeEnumSchema.describe('Type de collectivité'),
  activeCOT: z.boolean(),
  communeCode: z.string().nullable(),
  siren: z.string().nullable(),
  nic: z.string().nullable(),
  departementCode: z.string().nullable(),
  regionCode: z.string().nullable(),
  natureInsee: collectiviteNatureEnumSchema
    .nullable()
    .describe('Nature de la collectivité tel que défini dans la base Banatic'),
  population: z.number().nullable(),
  dansAireUrbaine: z.boolean().nullable(),
});

export type Collectivite = z.infer<typeof collectiviteSchema>;

export const collectiviteResumeSchema = collectiviteSchema.pick({
  id: true,
  nom: true,
  siren: true,
  communeCode: true,
  natureInsee: true,
  type: true,
  activeCOT: true,
});

export const collectivitePublicSchema = collectiviteSchema;

export const createCollectiviteSchema = z.object({
  id: z.number().optional(),
  modifiedAt: z.string().optional(),
  createdAt: z.string().optional(),
  accesRestreint: z.boolean().nullish(),
  nom: z.string(),
  type: collectiviteTypeEnumSchema,
  communeCode: z.string().nullish(),
  siren: z.string().nullish(),
  nic: z.string().nullish(),
  departementCode: z.string().nullish(),
  regionCode: z.string().nullish(),
  natureInsee: collectiviteNatureEnumSchema.nullish(),
  population: z.number().nullish(),
  dansAireUrbaine: z.boolean().nullish(),
});

export const collectiviteUpsertSchema = createCollectiviteSchema.partial({
  nom: true,
});

export type CollectiviteResume = z.infer<typeof collectiviteResumeSchema>;
export type CollectivitePublic = z.infer<typeof collectivitePublicSchema>;
export type CreateCollectivite = z.infer<typeof createCollectiviteSchema>;
export type CollectiviteUpsert = z.infer<typeof collectiviteUpsertSchema>;

export const collectiviteUpdateNICSchema = z
  .object({
    siren: z.string(),
    nic: z.string(),
  })
  .array();

export type CollectiviteUpdateNIC = z.infer<typeof collectiviteUpdateNICSchema>;
