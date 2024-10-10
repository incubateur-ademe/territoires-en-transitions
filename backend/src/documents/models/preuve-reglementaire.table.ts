import { pgTable, varchar } from 'drizzle-orm/pg-core';
import { DocumentBase } from './document.basetable';
import { preuveReglementaireDefinitionTable } from './preuve-reglementaire-definition.table';

export const preuveReglementaireTable = pgTable('preuve_reglementaire', {
  ...DocumentBase,
  preuveId: varchar('preuve_id')
    .notNull()
    .references(() => preuveReglementaireDefinitionTable.id),
});
