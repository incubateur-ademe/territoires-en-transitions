import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { createdAt } from '@tet/backend/utils/column.utils';
import { integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';

/**
 * Un référent est soit un membre de l'organisme (`userId`), soit un contact
 * hors plateforme (`libelle` + `email`) — contrainte reprise en base.
 */
export const pcaetReferentTable = pgTable('demarche_pcaet_referent', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  organismeCollectiviteId: integer('organisme_collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => authUsersTable.id, {
    onDelete: 'cascade',
  }),
  libelle: text('libelle'),
  email: text('email'),
  createdAt,
  createdBy: uuid('created_by').references(() => authUsersTable.id, {
    onDelete: 'set null',
  }),
});
