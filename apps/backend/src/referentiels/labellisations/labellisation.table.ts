import { collectiviteId } from '@/backend/collectivites/collectivite-id.column';
import {
  serialIdPrimaryKey,
  TIMESTAMP_OPTIONS,
} from '@/backend/utils/column.utils';
import { Etoile } from '@/domain/referentiels';
import {
  doublePrecision,
  integer,
  pgTable,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { referentielIdPgEnum } from '../referentiel-id.column';

export const labellisationTable = pgTable(
  'labellisation',
  {
    ...serialIdPrimaryKey,
    ...collectiviteId,
    referentiel: referentielIdPgEnum('referentiel').notNull(),
    obtenueLe: timestamp('obtenue_le', TIMESTAMP_OPTIONS).notNull(),
    annee: integer('annee').notNull(),
    etoiles: integer('etoiles').$type<Etoile>().notNull(),
    scoreRealise: doublePrecision('score_realise'),
    scoreProgramme: doublePrecision('score_programme'),
    auditId: integer('audit_id'),
  },
  (table) => [
    unique('labellisation_collectivite_id_annee_referentiel_key').on(
      table.collectiviteId,
      table.referentiel,
      table.annee
    ),
  ]
);
