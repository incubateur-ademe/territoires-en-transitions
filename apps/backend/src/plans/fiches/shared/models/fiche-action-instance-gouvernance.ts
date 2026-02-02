import { instanceGouvernanceTagTable } from '@tet/backend/collectivites/tags/instance-gouvernance.table';
import { createdAt, createdBy } from '@tet/backend/utils/column.utils';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { ficheActionTable } from './fiche-action.table';

export const ficheActionInstanceGouvernanceTableTag = pgTable(
  'fiche_action_instance_de_gouvernance_tag',
  {
    ficheId: integer('fiche_action_id').references(() => ficheActionTable.id, {
      onDelete: 'cascade',
    }),
    instanceGouvernanceTagId: integer(
      'instance_de_gouvernance_tag_id'
    ).references(() => instanceGouvernanceTagTable.id, {
      onDelete: 'cascade',
    }),
    createdAt,
    createdBy,
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [table.ficheId, table.instanceGouvernanceTagId],
      }),
    };
  }
);
