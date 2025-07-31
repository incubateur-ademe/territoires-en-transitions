import { collectiviteTable } from '@/backend/collectivites/shared/models/collectivite.table';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { foreignKey, index, pgTable, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
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
  (table) => {
    return {
      idxCollectivite: index('preuve_reglementaire_idx_collectivite').using(
        'btree',
        table.collectiviteId.asc().nullsLast()
      ),
      preuveCollectiviteId: foreignKey({
        columns: [table.collectiviteId],
        foreignColumns: [collectiviteTable.id],
        name: 'preuve_collectivite_id',
      }),
      preuveReglementairePreuveIdFkey: foreignKey({
        columns: [table.preuveId],
        foreignColumns: [preuveReglementaireDefinitionTable.id],
        name: 'preuve_reglementaire_preuve_id_fkey',
      }),
    };
  }
);

export type PreuveReglementaireType = InferSelectModel<
  typeof preuveReglementaireTable
>;
export type CreatePreuveReglementaireType = InferInsertModel<
  typeof preuveReglementaireTable
>;

export const preuveReglementaireSchema = createSelectSchema(
  preuveReglementaireTable
);
export const createPreuveReglementaireSchema = createInsertSchema(
  preuveReglementaireTable
);
