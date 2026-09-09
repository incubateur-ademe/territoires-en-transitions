import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { createdAt } from '@tet/backend/utils/column.utils';
import {
  categorieActionEnumValues,
  levierIdEnumValues,
} from '@tet/domain/shared';
import {
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  uuid,
} from 'drizzle-orm/pg-core';

export const levierIdEnum = pgEnum('levier_id', levierIdEnumValues);

export const levierCategorieEnum = pgEnum(
  'levier_categorie',
  categorieActionEnumValues
);

export const ficheActionLevierTable = pgTable(
  'fiche_action_levier',
  {
    ficheId: integer('fiche_id')
      .notNull()
      .references(() => ficheActionTable.id, { onDelete: 'cascade' }),
    levierId: levierIdEnum('levier_id').notNull(),
    categorie: levierCategorieEnum('categorie').notNull(),
    createdAt,
    createdBy: uuid('created_by')
      .notNull()
      .references(() => authUsersTable.id),
  },
  (table) => [
    primaryKey({ columns: [table.ficheId, table.levierId, table.categorie] }),
  ]
);
