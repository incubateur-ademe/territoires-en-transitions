import {
  collectiviteBanaticTypeTable,
  collectiviteNature,
} from '@/backend/collectivites/shared/models/collectivite-banatic-type.table';
import { createEnumObject } from '@/backend/utils/enum.utils';
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { createdAt, modifiedAt } from '../../../utils/column.utils';

export const collectiviteType = [
  'region',
  'departement',
  'epci',
  'commune',
  'test',
] as const;
export type CollectiviteType = (typeof collectiviteType)[number];

export const collectiviteTypeEnumSchema = z.enum(collectiviteType);

export const collectiviteTypeEnum = createEnumObject(collectiviteType);

export const collectiviteTable = pgTable('collectivite', {
  id: serial('id').primaryKey(),
  modifiedAt,
  createdAt,
  accessRestreint: boolean('access_restreint'),
  nom: text('nom'),
  type: text('type').notNull(), // TODO check collectiviteType
  communeCode: varchar('commune_code', { length: 5 }),
  siren: varchar('siren', { length: 9 }),
  nic: varchar('nic', { length: 5 }),
  departementCode: varchar('departement_code', { length: 3 }),
  regionCode: varchar('region_code', { length: 2 }),
  natureInsee: text('nature_insee').references(
    () => collectiviteBanaticTypeTable.id
  ),
  population: integer('population'),
  dansAireUrbaine: boolean('dans_aire_urbaine'),
});

export const collectiviteSchema = createSelectSchema(collectiviteTable, {
  type: z.enum(collectiviteType).describe('Type de collectivité'),
  natureInsee: z
    .enum(collectiviteNature)
    .describe('Nature de la collectivité tel que défini dans la base Banatic'),
});
export const collectiviteResumeSchema = collectiviteSchema.pick({
  id: true,
  nom: true,
  siren: true,
  communeCode: true,
  natureInsee: true,
  type: true,
});

export const collectivitePublicSchema = collectiviteSchema.omit({
  accessRestreint: true,
});

export const collectiviteUpsertSchema = createInsertSchema(collectiviteTable);
export type Collectivite = z.infer<typeof collectiviteSchema>;
export type CollectiviteResume = z.infer<typeof collectiviteResumeSchema>;
export type CollectivitePublic = z.infer<typeof collectivitePublicSchema>;
export type CollectiviteUpsert = z.infer<typeof collectiviteUpsertSchema>;

export const collectiviteUpdateNICSchema = z
  .object({
    siren: z.string(),
    nic: z.string(),
  })
  .array();

export type CollectiviteUpdateNIC = z.infer<typeof collectiviteUpdateNICSchema>;
