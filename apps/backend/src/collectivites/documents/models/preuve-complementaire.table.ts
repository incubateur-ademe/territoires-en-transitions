import { collectiviteTable } from '@/backend/collectivites/shared/models/collectivite.table';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { foreignKey, index, pgTable, text } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { actionRelationTable } from '../../../referentiels/models/action-relation.table';
import { DocumentBase } from './document.basetable';

export const preuveComplementaireTable = pgTable(
  'preuve_complementaire',
  {
    ...DocumentBase,
    actionId: text('action_id')
      .notNull()
      .references(() => actionRelationTable.id),
  },
  (table) => {
    return {
      idxCollectivite: index('preuve_complementaire_idx_collectivite').using(
        'btree',
        table.collectiviteId.asc().nullsLast()
      ),
      preuveCollectiviteId: foreignKey({
        columns: [table.collectiviteId],
        foreignColumns: [collectiviteTable.id],
        name: 'preuve_collectivite_id',
      }),
      preuveComplementaireActionIdFkey: foreignKey({
        columns: [table.actionId],
        foreignColumns: [actionRelationTable.id],
        name: 'preuve_complementaire_action_id_fkey',
      }),
    };
  }
);

export type PreuveComplementaireType = InferSelectModel<
  typeof preuveComplementaireTable
>;

export type CreatePreuveComplementaireType = InferInsertModel<
  typeof preuveComplementaireTable
>;

export const preuveComplementaireSchema = createSelectSchema(
  preuveComplementaireTable
);
export const createPreuveComplementaireSchema = createSelectSchema(
  preuveComplementaireTable
);
