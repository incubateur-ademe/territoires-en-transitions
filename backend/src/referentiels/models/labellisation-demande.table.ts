import { TIMESTAMP_OPTIONS } from '@/domain/utils';
import {
  boolean,
  foreignKey,
  integer,
  serial,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { authUsersTable } from '../../auth/models/auth-users.table';
import { collectiviteTable } from '../../collectivites/shared/models/collectivite.table';
import { labellisationEtoileEnum } from './labellisation-etoile.table';
import { labellisationSchema } from './labellisation.schema';
import { referentielEnum } from './referentiel.enum';

export enum LabellisationSujetDemandeEnumType {
  LABELLISATION = 'labellisation',
  LABELLISATION_COT = 'labellisation_cot',
  COT = 'cot',
}

export const labellisationSujetDemandeEnum = labellisationSchema.enum(
  'sujet_demande',
  [
    LabellisationSujetDemandeEnumType.LABELLISATION,
    LabellisationSujetDemandeEnumType.LABELLISATION_COT,
    LabellisationSujetDemandeEnumType.COT,
  ]
);

export const labellisationDemandeTable = labellisationSchema.table(
  'demande',
  {
    id: serial('id').primaryKey().notNull(),
    enCours: boolean('en_cours').default(true).notNull(),
    collectiviteId: integer('collectivite_id').notNull(),
    // TODO: change later to use the referentiel definition table
    referentiel: referentielEnum('referentiel').notNull(),
    etoiles: labellisationEtoileEnum('etoiles'),
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
