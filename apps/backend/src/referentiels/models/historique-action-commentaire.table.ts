import {
  index,
  integer,
  serial,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { historiqueSchema } from '../../collectivites/personnalisations/models/historique-reponse-choix.table';
import { actionIdVarchar } from './action-definition.table';

// Weirdly, the table name is 'action_precision' and not 'action_commentaire'
export const historiqueActionCommentaireTable = historiqueSchema.table(
  'action_precision',
  {
    id: serial('id').primaryKey().notNull(),
    collectiviteId: integer('collectivite_id').notNull(),
    // TODO: failed to parse database type 'action_id'
    actionId: actionIdVarchar.notNull(),
    precision: text('precision').notNull(),
    previousPrecision: text('previous_precision'),
    modifiedBy: uuid('modified_by'),
    previousModifiedBy: uuid('previous_modified_by'),
    modifiedAt: timestamp('modified_at', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
    previousModifiedAt: timestamp('previous_modified_at', {
      withTimezone: true,
      mode: 'string',
    }),
  },
  (table) => {
    return {
      hapIdxCid: index('hap_idx_cid').using(
        'btree',
        table.collectiviteId.asc().nullsLast()
      ),
      hapIdxCidMby: index('hap_idx_cid_mby').using(
        'btree',
        table.collectiviteId.asc().nullsLast(),
        table.modifiedBy.asc().nullsLast()
      ),
      hapIdxMat: index('hap_idx_mat').using(
        'btree',
        table.modifiedAt.asc().nullsLast()
      ),
    };
  }
);
