import { effetAttenduTable } from '@tet/backend/shared/effet-attendu/effet-attendu.table';
import { sql } from 'drizzle-orm';
import { integer, pgPolicy, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { authenticatedRole } from 'drizzle-orm/supabase';
import { ficheActionTable } from './fiche-action.table';

export const ficheActionEffetAttenduTable = pgTable(
  'fiche_action_effet_attendu',
  {
    ficheId: integer('fiche_id').references(() => ficheActionTable.id),
    effetAttenduId: integer('effet_attendu_id').references(
      () => effetAttenduTable.id
    ),
  },
  (table) => [
    primaryKey({ columns: [table.ficheId, table.effetAttenduId] }),

    pgPolicy('allow_read', {
      as: 'permissive',
      to: authenticatedRole,
      for: 'select',
      using: sql`peut_lire_la_fiche(fiche_id)`,
    }),
    pgPolicy('allow_insert', {
      as: 'permissive',
      to: authenticatedRole,
      for: 'insert',
      withCheck: sql`peut_modifier_la_fiche(fiche_id)`,
    }),
    pgPolicy('allow_update', {
      as: 'permissive',
      to: authenticatedRole,
      for: 'update',
      using: sql`peut_lire_la_fiche(fiche_id)`,
    }),
    pgPolicy('allow_delete', {
      as: 'permissive',
      to: authenticatedRole,
      for: 'delete',
      using: sql`peut_lire_la_fiche(fiche_id)`,
    }),
  ]
);
