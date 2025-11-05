import { collectiviteTable } from '@/backend/collectivites/shared/models/collectivite.table';
import { foreignKey, index, integer, pgTable } from 'drizzle-orm/pg-core';
import { labellisationDemandeTable } from '../../../referentiels/labellisations/labellisation-demande.table';
import { DocumentBase } from './document.basetable';

export const preuveLabellisationTable = pgTable(
  'preuve_labellisation',
  {
    ...DocumentBase,
    demandeId: integer('demande_id').notNull(),
  },
  (table) => [
    index('preuve_labellisation_idx_collectivite').using(
      'btree',
      table.collectiviteId.asc().nullsLast()
    ),
    foreignKey({
      columns: [table.collectiviteId],
      foreignColumns: [collectiviteTable.id],
      name: 'preuve_collectivite_id',
    }),
    foreignKey({
      columns: [table.demandeId],
      foreignColumns: [labellisationDemandeTable.id],
      name: 'preuve_labellisation_demande_id_fkey',
    }),
  ]
);
