import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  foreignKey,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { collectiviteTable } from '../../collectivites/models/collectivite.models';
import { referentielEnum } from './action-definition.table';

export const clientScoresTable = pgTable(
  'client_scores',
  {
    collectiviteId: integer('collectivite_id').notNull(),
    referentiel: referentielEnum('referentiel').notNull(), // TODO: Reference referentiel table
    scores: jsonb('scores').notNull(),
    modifiedAt: timestamp('modified_at', {
      withTimezone: true,
    }).notNull(),
    payloadTimestamp: timestamp('payload_timestamp', {
      withTimezone: true,
    }),
  },
  (table) => {
    return {
      clientScoresCollectiviteIdFkey: foreignKey({
        columns: [table.collectiviteId],
        foreignColumns: [collectiviteTable.id],
        name: 'client_scores_collectivite_id_fkey',
      }),
      clientScoresPkey: primaryKey({
        columns: [table.collectiviteId, table.referentiel],
        name: 'client_scores_pkey',
      }),
    };
  }
);

export type ClientScoresType = InferSelectModel<typeof clientScoresTable>;
export type CreateClientScoresType = InferInsertModel<typeof clientScoresTable>;

export const clientScoresSchema = createSelectSchema(clientScoresTable);
export const createClientScoresTable = createInsertSchema(clientScoresTable);
