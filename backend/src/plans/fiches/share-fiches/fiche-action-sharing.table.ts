import { collectiviteTable } from '@/backend/collectivites/index-domain';
import { ficheActionTable } from '@/backend/plans/fiches/index-domain';
import { createdAt, createdBy } from '@/backend/utils/column.utils';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const ficheActionSharingTable = pgTable(
  'fiche_action_sharing',
  {
    ficheId: integer('fiche_id')
      .notNull()
      .references(() => ficheActionTable.id, { onDelete: 'cascade' }),
    collectiviteId: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id, { onDelete: 'cascade' }),
    createdAt: createdAt,
    createdBy: createdBy,
  },
  (t) => [
    primaryKey({
      columns: [t.ficheId, t.collectiviteId],
      name: 'fiche_action_sharing_fiche_id_collectivite_id_pkey',
    }),
  ]
);

export const ficheActionSharingSchema = createSelectSchema(
  ficheActionSharingTable
);
export const ficheActionSharingInsertSchema = createInsertSchema(
  ficheActionSharingTable
);

export type FicheActionSharing = typeof ficheActionSharingTable.$inferSelect;
export type FicheActionSharingInsert =
  typeof ficheActionSharingTable.$inferInsert;
