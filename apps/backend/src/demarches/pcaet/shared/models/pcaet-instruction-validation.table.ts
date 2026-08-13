import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { TIMESTAMP_OPTIONS } from '@tet/backend/utils/column.utils';
import type { PcaetInstructionPartie } from '@tet/domain/demarches';
import {
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { pcaetDemandeAvisTable } from './pcaet-demande-avis.table';

export const pcaetInstructionValidationTable = pgTable(
  'pcaet_instruction_validation',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    demandeAvisId: integer('demande_avis_id')
      .notNull()
      .references(() => pcaetDemandeAvisTable.id, { onDelete: 'cascade' }),
    partie: text('partie').notNull().$type<PcaetInstructionPartie>(),
    validePar: uuid('valide_par').references(() => authUsersTable.id, {
      onDelete: 'set null',
    }),
    valideLe: timestamp('valide_le', TIMESTAMP_OPTIONS).defaultNow().notNull(),
  },
  (table) => [
    unique('pcaet_instruction_validation_unique_partie').on(
      table.demandeAvisId,
      table.partie
    ),
  ]
);
