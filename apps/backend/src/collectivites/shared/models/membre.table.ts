import {
  boolean,
  integer,
  pgTable,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { referentielIdPgEnum } from '../../../referentiels/referentiel-id.column';
import { authUsersTable } from '../../../users/models/auth-users.table';
import { createdAt, modifiedAt } from '../../../utils/column.utils';
import { collectiviteTable } from './collectivite.table';
import { membreFonctionEnum } from './membre-fonction.enum';

export const membreTable = pgTable(
  'private_collectivite_membre',
  {
    userId: uuid('user_id')
      .references(() => authUsersTable.id)
      .notNull(),
    collectiviteId: integer('collectivite_id')
      .references(() => collectiviteTable.id)
      .notNull(),
    fonction: membreFonctionEnum('fonction'),
    detailsFonction: text('details_fonction'),
    champIntervention: referentielIdPgEnum('champ_intervention').array(),
    estReferent: boolean('est_referent'),
    createdAt,
    modifiedAt,
  },
  (table) => [
    unique('private_collectivite_membre_user_collectivite').on(
      table.collectiviteId,
      table.userId
    ),
  ]
);

export const membreSchema = createSelectSchema(membreTable);

export const insertMembreSchema = createInsertSchema(membreTable);
