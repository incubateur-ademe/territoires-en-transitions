import { pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { tagTableBase } from './tag.table-base';

export const structureTagTable = pgTable(
  'structure_tag',
  { ...tagTableBase },
  (table) => [
    uniqueIndex('structure_tag_nom_collectivite_id_key').on(
      table.nom,
      table.collectiviteId
    ),
  ]
);

export const structureTagSchema = createSelectSchema(structureTagTable);

export type StructureTag = typeof structureTagTable.$inferSelect;
