import { collectiviteTable } from '@/backend/collectivites/shared/models/collectivite.table';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { foreignKey, index, integer, pgTable } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { labellisationDemandeTable } from '../../../referentiels/labellisations/labellisation-demande.table';
import { DocumentBase } from './document.basetable';

export const preuveLabellisationTable = pgTable(
  'preuve_labellisation',
  {
    ...DocumentBase,
    demandeId: integer('demande_id').notNull(),
  },
  (table) => {
    return {
      idxCollectivite: index('preuve_labellisation_idx_collectivite').using(
        'btree',
        table.collectiviteId.asc().nullsLast()
      ),
      preuveCollectiviteId: foreignKey({
        columns: [table.collectiviteId],
        foreignColumns: [collectiviteTable.id],
        name: 'preuve_collectivite_id',
      }),
      preuveLabellisationDemandeIdFkey: foreignKey({
        columns: [table.demandeId],
        foreignColumns: [labellisationDemandeTable.id],
        name: 'preuve_labellisation_demande_id_fkey',
      }),
    };
  }
);

export type PreuveLabellisationType = InferSelectModel<
  typeof preuveLabellisationTable
>;
export type CreatePreuveLabellisationType = InferInsertModel<
  typeof preuveLabellisationTable
>;

export const preuveLabellisationSchema = createSelectSchema(
  preuveLabellisationTable
);
export const createPreuveLabellisationSchema = createInsertSchema(
  preuveLabellisationTable
);
