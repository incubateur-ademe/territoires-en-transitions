import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { ObjetPreuveEnum } from '@tet/domain/referentiels';
import { foreignKey, index, integer, pgTable } from 'drizzle-orm/pg-core';
import { labellisationDemandeTable } from '../../../referentiels/labellisations/labellisation-demande.table';
import { labellisationSchema } from '../../../referentiels/labellisations/labellisation.schema';
import { documentBase } from './document.basetable';

export const labellisationObjetPreuveEnum = labellisationSchema.enum(
  'objet_preuve',
  ObjetPreuveEnum
);

export const preuveLabellisationTable = pgTable(
  'preuve_labellisation',
  {
    ...documentBase,
    demandeId: integer('demande_id').notNull(),
    objet: labellisationObjetPreuveEnum('objet'),
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
