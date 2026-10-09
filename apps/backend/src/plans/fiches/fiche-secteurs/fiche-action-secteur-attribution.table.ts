import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { TIMESTAMP_OPTIONS } from '@tet/backend/utils/column.utils';
import { OrigineSecteurs } from '@tet/domain/plans';
import { sql } from 'drizzle-orm';
import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { ficheActionTable } from '../shared/models/fiche-action.table';
import { secteurReglementairePgEnum } from './secteur-reglementaire.column';

/** Pas de ligne : la fiche n'a jamais été demandée à Communs */
export const ficheActionSecteurAttributionTable = pgTable(
  'fiche_action_secteur_attribution',
  {
    ficheId: integer('fiche_id')
      .primaryKey()
      .references(() => ficheActionTable.id, { onDelete: 'cascade' }),
    secteurs: secteurReglementairePgEnum('secteurs').array().notNull(),
    origine: text('origine').$type<OrigineSecteurs>().notNull(),
    methode: text('methode'),
    reponseCommuns: jsonb('reponse_communs'),
    justification: text('justification'),
    modifiedAt: timestamp('modified_at', TIMESTAMP_OPTIONS)
      .notNull()
      .default(sql`now()`),
    modifiedBy: uuid('modified_by').references(() => authUsersTable.id),
  }
);

export type FicheActionSecteurAttribution =
  typeof ficheActionSecteurAttributionTable.$inferSelect;
