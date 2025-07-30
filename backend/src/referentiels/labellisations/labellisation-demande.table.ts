import { TIMESTAMP_OPTIONS } from '@/backend/utils/column.utils';
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
import { referentielIdPgEnum } from '../models/referentiel-id.enum';
import { etoilePgEnum } from './etoile-definition.table';
import { labellisationSchema } from './labellisation.schema';

export const SujetDemandeEnum = {
  LABELLISATION: 'labellisation',
  LABELLISATION_COT: 'labellisation_cot',
  COT: 'cot',
} as const;

export type SujetDemande =
  (typeof SujetDemandeEnum)[keyof typeof SujetDemandeEnum];

export const labellisationSujetDemandeEnum = labellisationSchema.enum(
  'sujet_demande',
  [
    SujetDemandeEnum.LABELLISATION,
    SujetDemandeEnum.LABELLISATION_COT,
    SujetDemandeEnum.COT,
  ]
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
  },
  (table) => {
    return {
      demandeCollectiviteIdFkey: foreignKey({
        columns: [table.collectiviteId],
        foreignColumns: [collectiviteTable.id],
        name: 'demande_collectivite_id_fkey',
      }),
      demandeDemandeurFkey: foreignKey({
        columns: [table.demandeur],
        foreignColumns: [authUsersTable.id],
        name: 'demande_demandeur_fkey',
      }),
    };
  }
);

export type LabellisationDemande =
  typeof labellisationDemandeTable.$inferSelect;
