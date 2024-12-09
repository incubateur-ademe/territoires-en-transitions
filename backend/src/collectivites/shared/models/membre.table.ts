import { authUsersTable } from '@/backend/auth';
import { referentielEnum } from '@/backend/referentiels';
import { createdAt, modifiedAt } from '@/backend/utils';
import {
  boolean,
  integer,
  pgTable,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
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
    champIntervention: referentielEnum('champ_intervention').array(),
    estReferent: boolean('est_referent'),
    createdAt,
    modifiedAt,
  },
  (table) => ({
    oneUserPerCollectivite: unique(
      'private_collectivite_membre_user_collectivite'
    ).on(table.collectiviteId, table.userId),
  })
);

export const insertMembreSchema = createInsertSchema(membreTable);
