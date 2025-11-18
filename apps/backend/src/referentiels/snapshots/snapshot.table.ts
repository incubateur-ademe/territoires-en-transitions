import {
  doublePrecision,
  foreignKey,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import z from 'zod';
import {
  PersonnalisationReponsesPayload,
  personnalisationReponsesPayloadSchema,
} from '../../collectivites/personnalisations/models/get-personnalisation-reponses.response';
import { collectiviteTable } from '../../collectivites/shared/models/collectivite.table';
import {
  createdAt,
  createdBy,
  modifiedAt,
  modifiedBy,
  TIMESTAMP_OPTIONS,
} from '../../utils/column.utils';
import { auditTable } from '../labellisations/audit.table';
import { referentielDefinitionTable } from '../models/referentiel-definition.table';
import { referentielIdEnumSchema } from '../models/referentiel-id.enum';
import { referentielIdPgEnum } from '../referentiel-id.column';
import { ScoresPayload, scoresPayloadSchema } from './scores-payload.dto';
import {
  SnapshotJalon,
  snapshotJalonEnumSchema,
  snapshotJalonEnumValues,
} from './snapshot-jalon.enum';

const snapshotJalonPgEnum = pgEnum('type_jalon', snapshotJalonEnumValues);

export const snapshotTable = pgTable(
  'score_snapshot',
  {
    collectiviteId: integer('collectivite_id').notNull(),
    referentielId: referentielIdPgEnum('referentiel_id').notNull(),
    referentielVersion: varchar('referentiel_version', { length: 16 }),
    auditId: integer('audit_id'),
    date: timestamp('date', TIMESTAMP_OPTIONS).notNull(),
    jalon: snapshotJalonPgEnum('type_jalon').notNull().$type<SnapshotJalon>(), // not an enum in the database but in order to type it
    ref: varchar('ref', { length: 30 }).notNull(),
    nom: varchar('nom', { length: 300 }).notNull(),
    pointFait: doublePrecision('point_fait').notNull(),
    pointProgramme: doublePrecision('point_programme').notNull(),
    pointPasFait: doublePrecision('point_pas_fait').notNull(),
    pointPotentiel: doublePrecision('point_potentiel').notNull(), 
    etoiles: integer('etoiles'),
    scoresPayload: jsonb('referentiel_scores').notNull().$type<ScoresPayload>(),
    personnalisationReponses: jsonb('personnalisation_reponses')
      .$type<PersonnalisationReponsesPayload>()
      .notNull(),
    createdBy,
    createdAt,
    modifiedAt,
    modifiedBy,
  },
  (table) => [
    primaryKey({
      columns: [table.collectiviteId, table.referentielId, table.ref],
      name: 'score_snapshot_collectivite_id_referentiel_id_ref_pkey',
    }),
    foreignKey({
      columns: [table.collectiviteId],
      foreignColumns: [collectiviteTable.id],
      name: 'score_snapshot_collectivite_id_fkey',
    }),
    foreignKey({
      columns: [table.referentielId],
      foreignColumns: [referentielDefinitionTable.id],
      name: 'score_snapshot_referentiel_id_fkey',
    }),
    foreignKey({
      columns: [table.auditId],
      foreignColumns: [auditTable.id],
      name: 'score_snapshot_audit_id_fkey',
    }).onDelete('cascade'),
    unique().on(
      table.collectiviteId,
      table.referentielId,
      table.jalon,
      table.date
    ),
  ]
);

// const snapshotSchema = createSelectSchema(snapshotTable);
const snapshotSchema = z.object({
  collectiviteId: z.int(),
  referentielId: referentielIdEnumSchema,
  referentielVersion: z.string().nullable(),
  auditId: z.int().nullable(),
  date: z.iso.datetime(),
  jalon: snapshotJalonEnumSchema,
  ref: z.string(),
  nom: z.string(),
  pointFait: z.number(),
  pointProgramme: z.number(),
  pointPasFait: z.number(),
  pointPotentiel: z.number(),
  etoiles: z.number().nullable(),
  scoresPayload: scoresPayloadSchema,
  personnalisationReponses: personnalisationReponsesPayloadSchema,
  createdAt: z.iso.datetime(),
  createdBy: z.string().nullable(),
  modifiedAt: z.iso.datetime(),
  modifiedBy: z.string().nullable(),
});

export type Snapshot = z.infer<typeof snapshotSchema>;

const _snapshotSchemaInsert = createInsertSchema(snapshotTable);

export type SnapshotInsert = z.infer<typeof _snapshotSchemaInsert> & {
  scoresPayload: ScoresPayload;
  personnalisationReponses: PersonnalisationReponsesPayload;
};

// All fields except JSON payloads (action scores and personnalisation reponses)
export const snapshotWithoutPayloadsSchema = z.object({
  ...snapshotSchema.omit({
    scoresPayload: true,
    personnalisationReponses: true,
  }).shape,
  pointNonRenseigne: z.number().optional().describe('Points non renseignés'),
});

export type SnapshotWithoutPayloads = z.infer<
  typeof snapshotWithoutPayloadsSchema
>;
