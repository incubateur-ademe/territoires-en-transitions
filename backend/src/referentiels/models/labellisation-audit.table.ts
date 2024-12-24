import { TIMESTAMP_OPTIONS } from '@/domain/utils';
import { InferInsertModel, InferSelectModel, sql } from 'drizzle-orm';
import {
  boolean,
  foreignKey,
  integer,
  serial,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { collectiviteTable } from '../../collectivites/shared/models/collectivite.table';
import { labellisationDemandeTable } from './labellisation-demande.table';
import { labellisationSchema } from './labellisation.schema';
import { referentielIdPgEnum } from './referentiel.enum';

export const labellisationAuditTable = labellisationSchema.table(
  'audit',
  {
    id: serial('id').primaryKey().notNull(),
    collectiviteId: integer('collectivite_id').notNull(),
    // TODO: change later to use the referentiel definition table
    referentiel: referentielIdPgEnum('referentiel').notNull(),
    demandeId: integer('demande_id'),
    dateDebut: timestamp('date_debut', TIMESTAMP_OPTIONS),
    dateFin: timestamp('date_fin', TIMESTAMP_OPTIONS),
    valide: boolean('valide').default(false).notNull(),
    dateCnl: timestamp('date_cnl', TIMESTAMP_OPTIONS),
    valideLabellisation: boolean('valide_labellisation'),
    clos: boolean('clos').default(false).notNull(),
  },
  (table) => {
    return {
      existant: uniqueIndex('audit_existant')
        .using(
          'btree',
          table.collectiviteId.asc().nullsLast(),
          table.referentiel.asc().nullsLast()
        )
        .where(sql`(NOT clos)`),
      auditCollectiviteIdFkey: foreignKey({
        columns: [table.collectiviteId],
        foreignColumns: [collectiviteTable.id],
        name: 'audit_collectivite_id_fkey',
      }),
      auditDemandeIdFkey: foreignKey({
        columns: [table.demandeId],
        foreignColumns: [labellisationDemandeTable.id],
        name: 'audit_demande_id_fkey',
      }),
    };
  }
);

export type LabellisationAuditType = InferSelectModel<
  typeof labellisationAuditTable
>;

export type CreateLabellisationAuditType = InferInsertModel<
  typeof labellisationAuditTable
>;

export const labellisationAuditSchema = createSelectSchema(
  labellisationAuditTable
);
export const createLabellisationAuditSchema = createInsertSchema(
  labellisationAuditTable
);
