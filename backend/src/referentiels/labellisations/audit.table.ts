import { TIMESTAMP_OPTIONS } from '@/backend/utils/index-domain';
import { sql } from 'drizzle-orm';
import {
  boolean,
  foreignKey,
  integer,
  serial,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { collectiviteTable } from '../../collectivites/shared/models/collectivite.table';
import { referentielIdPgEnum } from '../models/referentiel-id.enum';
import { labellisationDemandeTable } from './labellisation-demande.table';
import { labellisationSchema } from './labellisation.schema';

export const auditTable = labellisationSchema.table(
  'audit',
  {
    id: serial('id').primaryKey().notNull(),
    collectiviteId: integer('collectivite_id').notNull(),
    // TODO: change later to use the referentiel definition table
    referentielId: referentielIdPgEnum('referentiel').notNull(),
    demandeId: integer('demande_id'),
    dateDebut: timestamp('date_debut', TIMESTAMP_OPTIONS),
    dateFin: timestamp('date_fin', TIMESTAMP_OPTIONS),
    valide: boolean('valide').default(false).notNull(),
    dateCnl: timestamp('date_cnl', TIMESTAMP_OPTIONS),
    valideLabellisation: boolean('valide_labellisation'),
    clos: boolean('clos').default(false).notNull(),
  },
  (table) => [
    uniqueIndex('audit_existant')
      .using(
        'btree',
        table.collectiviteId.asc().nullsLast(),
        table.referentielId.asc().nullsLast()
      )
      .where(sql`(NOT clos)`),
    foreignKey({
      columns: [table.collectiviteId],
      foreignColumns: [collectiviteTable.id],
      name: 'audit_collectivite_id_fkey',
    }),
    foreignKey({
      columns: [table.demandeId],
      foreignColumns: [labellisationDemandeTable.id],
      name: 'audit_demande_id_fkey',
    }),
  ]
);

export type Audit = typeof auditTable.$inferSelect;
export const auditSchema = createSelectSchema(auditTable);
