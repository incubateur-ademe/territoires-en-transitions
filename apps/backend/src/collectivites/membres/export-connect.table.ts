import { authUsersTable } from '@/backend/users/models/auth-users.table';
import { utilisateurSchema } from '@/backend/users/models/invitation.table';
import { modifiedAt } from '@/backend/utils/column.utils';
import { text, uuid } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import z from 'zod';

export const exportConnectTable = utilisateurSchema.table('export_connect', {
  userId: uuid('user_id')
    .references(() => authUsersTable.id)
    .notNull(),
  /** l'email utilisé pour le dernier export et qui sert d'id pour les MàJ du contact */
  exportId: text('export_id').notNull(),
  checksum: text('checksum').notNull(),
  modifiedAt,
});

export const exportConnectSchema = createSelectSchema(exportConnectTable);

export const upsertExportConnectSchema = exportConnectSchema
  .omit({
    modifiedAt: true,
  })
  .array();

export type UpsertExportConnect = z.infer<typeof upsertExportConnectSchema>;
