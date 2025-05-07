import { boolean, pgTable, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import z from 'zod';
import { tagTableBase } from '../tag.table-base';
import { authUsersTable } from '@/backend/auth/models/auth-users.table';

export const personneTagTable = pgTable(
  'personne_tag',
  {
    ...tagTableBase,
    associatedUserId: uuid('associated_user_id').references(
      () => authUsersTable.id
    ),
    deleted: boolean('deleted'), // = associatedUseId !== null
  },
  (table) => [
    uniqueIndex('personne_tag_nom_collectivite_id_key').on(
      table.nom,
      table.collectiviteId
    ),
  ]
);

export const personneTagSchema = createSelectSchema(personneTagTable);
export type PersonneTag = z.infer<typeof personneTagSchema>;
