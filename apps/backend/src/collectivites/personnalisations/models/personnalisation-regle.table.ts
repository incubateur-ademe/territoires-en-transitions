import { actionIdReference } from '@tet/backend/referentiels/models/action-relation.table';
import { modifiedAt } from '@tet/backend/utils/column.utils';
import { regleTypeEnumValues } from '@tet/domain/collectivites';
import { pgEnum, pgTable, primaryKey, text } from 'drizzle-orm/pg-core';

export const regleTypeEnum = pgEnum('regle_type', regleTypeEnumValues);

export const personnalisationRegleTable = pgTable(
  'personnalisation_regle',
  {
    actionId: actionIdReference.notNull(),
    type: regleTypeEnum('type').notNull(),
    formule: text('formule').notNull(),
    description: text('description').notNull(),
    modifiedAt,
  },
  (table) => [
    primaryKey({
      columns: [table.actionId, table.type],
      name: 'personnalisation_regle_pkey',
    }),
  ]
);
