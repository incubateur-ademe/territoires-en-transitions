import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { modifiedAt, modifiedBy } from '@tet/backend/utils/column.utils';
import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
} from 'drizzle-orm/pg-core';
import { indicateurDefinitionTable } from './indicateur-definition.table';

export const indicateurCollectiviteTable = pgTable(
  'indicateur_collectivite',
  {
    collectiviteId: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id, {
        onDelete: 'cascade',
      }),
    indicateurId: integer('indicateur_id')
      .notNull()
      .references(() => indicateurDefinitionTable.id, {
        onDelete: 'cascade',
      }),
    commentaire: text('commentaire'),
    confidentiel: boolean('confidentiel').default(false).notNull(),
    favoris: boolean('favoris').default(false).notNull(),
    modifiedBy,
    modifiedAt,
  },
  (table) => [
    primaryKey({ columns: [table.collectiviteId, table.indicateurId] }),
  ]
);
