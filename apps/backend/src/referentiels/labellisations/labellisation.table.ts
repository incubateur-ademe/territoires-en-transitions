import { collectiviteId } from '@/backend/collectivites/collectivite-id.column';
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
import z from 'zod';
import { referentielIdEnumSchema } from '../models/referentiel-id.enum';
import { referentielIdPgEnum } from '../referentiel-id.column';
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

export const labellisationSchema = z.object({
  id: z.number(),
  collectiviteId: z.number(),
  referentiel: referentielIdEnumSchema,
  obtenueLe: z.string(),
  annee: z.number(),
  etoiles: z.number(),
  scoreRealise: z.number().nullable(),
  scoreProgramme: z.number().nullable(),
});

export type Labellisation = z.infer<typeof labellisationSchema>;
