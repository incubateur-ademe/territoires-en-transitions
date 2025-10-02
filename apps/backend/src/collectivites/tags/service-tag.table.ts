import { pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import z from 'zod';
import { tagTableBase } from './tag.table-base';

export const serviceTagTable = pgTable(
  'service_tag',
  { ...tagTableBase },
  (table) => [
    uniqueIndex('service_tag_nom_collectivite_id_key').on(
      table.nom,
      table.collectiviteId
    ),
  ]
);

export const serviceTagSchema = createSelectSchema(serviceTagTable);
export type ServiceTag = z.infer<typeof serviceTagSchema>;

export const serviceTagInsertSchema = createInsertSchema(serviceTagTable);
export type ServiceTagInsert = z.infer<typeof serviceTagInsertSchema>;
