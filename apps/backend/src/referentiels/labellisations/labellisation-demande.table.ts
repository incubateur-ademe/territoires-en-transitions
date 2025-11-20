import { TIMESTAMP_OPTIONS } from '@tet/backend/utils/column.utils';
import {
  etoileAsStringEnumValues,
  SujetDemandeEnum,
} from '@tet/domain/referentiels';
import {
  boolean,
  foreignKey,
  integer,
  serial,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../collectivites/shared/models/collectivite.table';
import { authUsersTable } from '../../users/models/auth-users.table';
import { referentielIdPgEnum } from '../referentiel-id.column';
import { labellisationSchema } from './labellisation.schema';

export const labellisationSujetDemandeEnum = labellisationSchema.enum(
  'sujet_demande',
  SujetDemandeEnum
);

const etoilePgEnum = labellisationSchema.enum(
  'etoile',
  etoileAsStringEnumValues
);

export const labellisationDemandeTable = labellisationSchema.table(
  'demande',
  {
    id: serial('id').primaryKey().notNull(),
    enCours: boolean('en_cours').default(true).notNull(),
    collectiviteId: integer('collectivite_id').notNull(),
    // TODO: change later to use the referentiel definition table
    referentiel: referentielIdPgEnum('referentiel').notNull(),
    etoiles: etoilePgEnum('etoiles'),
    date: timestamp('date', TIMESTAMP_OPTIONS).defaultNow().notNull(),
    sujet: labellisationSujetDemandeEnum('sujet'),
    modifiedAt: timestamp('modified_at', {
      withTimezone: true,
      mode: 'string',
    }),
    envoyeeLe: timestamp('envoyee_le', TIMESTAMP_OPTIONS),
    demandeur: uuid('demandeur'),
    associatedCollectiviteId: integer('associated_collectivite_id'),
  },
  (table) => [
    foreignKey({
      columns: [table.collectiviteId],
      foreignColumns: [collectiviteTable.id],
      name: 'demande_collectivite_id_fkey',
    }),
    foreignKey({
      columns: [table.associatedCollectiviteId],
      foreignColumns: [collectiviteTable.id],
      name: 'demande_associated_collectivite_id_fkey',
    }),
    foreignKey({
      columns: [table.demandeur],
      foreignColumns: [authUsersTable.id],
      name: 'demande_demandeur_fkey',
    }),
  ]
);
