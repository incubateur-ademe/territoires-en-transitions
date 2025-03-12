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
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import z from 'zod';
import { collectiviteTable } from '../../collectivites/shared/models/collectivite.table';
import {
  PersonnalisationReponsesPayload,
  personnalisationReponsesPayloadSchema,
} from '../../personnalisations/models/get-personnalisation-reponses.response';
import {
  createdAt,
  createdBy,
  modifiedAt,
  modifiedBy,
  TIMESTAMP_OPTIONS,
} from '../../utils/column.utils';
import { auditTable } from '../labellisations/audit.table';
import {
  referentielDefinitionTable,
  referentielIdVarchar,
} from '../models/referentiel-definition.table';
import { ScoresPayload, scoresPayloadSchema } from './scores-payload.dto';
import { snapshotJalonEnumSchema } from './snapshot-jalon.enum';

const snapshotJalonPgEnum = pgEnum(
  'type_jalon',
  snapshotJalonEnumSchema.options
);

export const snapshotTable = pgTable(
  'score_snapshot',
  {
    collectiviteId: integer('collectivite_id').notNull(),
    referentielId: referentielIdVarchar.notNull(),
    referentielVersion: varchar('referentiel_version', { length: 16 }),
    auditId: integer('audit_id'),
    date: timestamp('date', TIMESTAMP_OPTIONS).notNull(),
    jalon: snapshotJalonPgEnum('type_jalon').notNull(), // not an enum in the database but in order to type it
    ref: varchar('ref', { length: 30 }).notNull(),
    nom: varchar('nom', { length: 300 }).notNull(),
    pointFait: doublePrecision('point_fait').notNull(),
    pointProgramme: doublePrecision('point_programme').notNull(),
    pointPasFait: doublePrecision('point_pas_fait').notNull(),
    pointPotentiel: doublePrecision('point_potentiel').notNull(),
    scoresPayload: jsonb('referentiel_scores').$type<ScoresPayload>().notNull(),
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

export const snapshotSchema = createSelectSchema(snapshotTable).extend({
  scoresPayload: scoresPayloadSchema,
  personnalisationReponses: personnalisationReponsesPayloadSchema,
});

export type Snapshot = z.infer<typeof snapshotSchema>;

export const snapshotSchemaInsert = createInsertSchema(snapshotTable).extend({
  scoresPayload: scoresPayloadSchema,
  personnalisationReponses: personnalisationReponsesPayloadSchema,
});

export type SnapshotInsert = z.infer<typeof snapshotSchemaInsert>;

// All fields except JSON payloads (action scores and personnalisation reponses)
export const snapshotWithoutPayloadsSchema = snapshotSchema
  .omit({
    scoresPayload: true,
    personnalisationReponses: true,
  })
  .extend({
    pointNonRenseigne: z.number().optional().describe('Points non renseignés'),
  });

export type SnapshotWithoutPayloads = z.infer<
  typeof snapshotWithoutPayloadsSchema
>;
