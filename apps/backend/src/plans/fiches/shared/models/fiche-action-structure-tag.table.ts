import { structureTagTable } from '@/backend/collectivites/tags/structure-tag.table';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { ficheActionTable } from './fiche-action.table';

export const ficheActionStructureTagTable = pgTable(
  'fiche_action_structure_tag',
  {
    ficheId: integer('fiche_id').references(() => ficheActionTable.id, {
      onDelete: 'cascade',
    }),
    structureTagId: integer('structure_tag_id').references(
      () => structureTagTable.id,
      { onDelete: 'cascade' }
    ),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.ficheId, table.structureTagId] }),
    };
  }
);
