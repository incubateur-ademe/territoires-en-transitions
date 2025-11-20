import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { foreignKey, index, pgTable, varchar } from 'drizzle-orm/pg-core';
import { DocumentBase } from './document.basetable';
import { preuveReglementaireDefinitionTable } from './preuve-reglementaire-definition.table';

export const preuveIdVarchar = varchar('preuve_id', { length: 50 });

export const preuveReglementaireTable = pgTable(
  'preuve_reglementaire',
  {
    ...DocumentBase,
    preuveId: preuveIdVarchar
      .notNull()
      .references(() => preuveReglementaireDefinitionTable.id),
  },
  (table) => [
    index('preuve_reglementaire_idx_collectivite').using(
      'btree',
      table.collectiviteId.asc().nullsLast()
    ),
    foreignKey({
      columns: [table.collectiviteId],
      foreignColumns: [collectiviteTable.id],
      name: 'preuve_collectivite_id',
    }),
    foreignKey({
      columns: [table.preuveId],
      foreignColumns: [preuveReglementaireDefinitionTable.id],
      name: 'preuve_reglementaire_preuve_id_fkey',
    }),
  ]
);
