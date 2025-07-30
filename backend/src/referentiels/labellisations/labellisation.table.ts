import { collectiviteId } from '@/backend/collectivites/collectivite-id.column';
import { referentielIdPgEnum } from '@/backend/referentiels/models/referentiel-id.enum';
import {
  serialIdPrimaryKey,
  TIMESTAMP_OPTIONS,
} from '@/backend/utils/column.utils';
import {
  doublePrecision,
  integer,
  pgTable,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { Etoile } from './etoile-definition.table';

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
  },
  (table) => [
    unique('labellisation_collectivite_id_annee_referentiel_key').on(
      table.collectiviteId,
      table.referentiel,
      table.annee
    ),
  ]
);

export const labellisationTableSchema = createSelectSchema(labellisationTable);

export type Labellisation = typeof labellisationTable.$inferSelect;
