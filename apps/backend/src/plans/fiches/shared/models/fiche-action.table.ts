import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { collectiviteTable } from '../../../../collectivites/shared/models/collectivite.table';
import { tempsDeMiseEnOeuvreTable } from '../../../../shared/models/temps-de-mise-en-oeuvre.table';
import {
  createdAt,
  createdBy,
  modifiedAt,
  modifiedBy,
  TIMESTAMP_OPTIONS,
} from '../../../../utils/column.utils';
import {
  ciblesEnumSchema,
  ciblesEnumValues,
  ficheActionResultatsAttenduValues,
  participationCitoyenneEnumValues,
  piliersEciEnumSchema,
  piliersEciEnumValues,
  prioriteEnumValues,
  statutsEnumSchema,
  statutsEnumValues,
} from '../../domain/fiche.types';

export const piliersEciPgEnum = pgEnum(
  'fiche_action_piliers_eci',
  piliersEciEnumValues
);

export const ficheActionResultatsAttendusEnum = pgEnum(
  'fiche_action_resultats_attendus',
  ficheActionResultatsAttenduValues
);

export const statutsPgEnum = pgEnum('fiche_action_statuts', statutsEnumValues);
export const ciblesPgEnum = pgEnum('fiche_action_cibles', ciblesEnumValues);
export const prioritePgEnum = pgEnum(
  'fiche_action_niveaux_priorite',
  prioriteEnumValues
);

export const ficheActionTable = pgTable('fiche_action', {
  id: serial('id').primaryKey().notNull(),
  titre: varchar('titre', { length: 300 }).default('Nouvelle fiche'),
  description: varchar('description', { length: 20000 }),
  piliersEci: piliersEciPgEnum('piliers_eci').array(),
  objectifs: varchar('objectifs', { length: 10000 }),
  cibles: text('cibles', {
    enum: ciblesEnumValues,
  }).array(),
  ressources: varchar('ressources', { length: 10000 }),
  financements: text('financements'),
  deprecated_DO_NOT_USE_budgetPrevisionnel: numeric('budget_previsionnel', {
    precision: 12,
    scale: 0,
  }),
  statut: statutsPgEnum('statut').default(statutsEnumSchema.enum['À venir']),
  priorite: prioritePgEnum('niveau_priorite'),
  dateDebut: timestamp('date_debut', TIMESTAMP_OPTIONS),
  dateFin: timestamp('date_fin_provisoire', TIMESTAMP_OPTIONS),
  ameliorationContinue: boolean('amelioration_continue'),
  calendrier: varchar('calendrier', { length: 10000 }),
  notesComplementaires: varchar('notes_complementaires', { length: 20000 }),
  instanceGouvernance: text('instance_gouvernance'),
  participationCitoyenne: text('participation_citoyenne'),
  participationCitoyenneType: varchar('participation_citoyenne_type', {
    length: 30,
    enum: participationCitoyenneEnumValues,
  }),
  tempsDeMiseEnOeuvre: integer('temps_de_mise_en_oeuvre_id').references(
    () => tempsDeMiseEnOeuvreTable.id
  ),
  majTermine: boolean('maj_termine'),
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
  createdAt,
  createdBy,
  modifiedAt,
  modifiedBy,
  restreint: boolean('restreint').default(false),
});

export const ficheSchema = createSelectSchema(ficheActionTable, {
  // Overriding array types as a workaround for drizzle-zod parsing issue
  // See https://github.com/drizzle-team/drizzle-orm/issues/1609
  piliersEci: z.array(piliersEciEnumSchema).describe('Piliers ECI'),
  cibles: z.array(ciblesEnumSchema).describe('Cibles'),
  ameliorationContinue: (schema) =>
    schema.ameliorationContinue.describe('Action se répète tous les ans'),
  deprecated_DO_NOT_USE_budgetPrevisionnel: (schema) =>
    schema.deprecated_DO_NOT_USE_budgetPrevisionnel.describe(
      'Budget prévisionnel total'
    ),
  restreint: (schema) => schema.restreint.describe('Confidentialité'),
  statut: (schema) => schema.statut.describe('Statut'),
  priorite: (schema) => schema.priorite.describe('Priorité'),
  participationCitoyenneType: (schema) =>
    schema.participationCitoyenneType.describe('Participation citoyenne'),
  dateDebut: (schema) => schema.dateDebut.describe('Date de début'),
  dateFin: (schema) => schema.dateFin.describe('Date de fin prévisionnelle'),
  createdAt: (schema) => schema.createdAt.describe('Date de création'),
  modifiedAt: (schema) => schema.modifiedAt.describe('Date de modification'),
});

export const ficheSchemaCreate = createInsertSchema(ficheActionTable, {
  // Overriding array types as a workaround for drizzle-zod parsing issue
  // See https://github.com/drizzle-team/drizzle-orm/issues/1609
  piliersEci: z.array(piliersEciEnumSchema),
  cibles: z.array(ciblesEnumSchema),
});

export type FicheCreate = InferInsertModel<typeof ficheActionTable>;

export const ficheSchemaUpdate = ficheSchemaCreate
  .omit({
    id: true,
    createdAt: true,
    createdBy: true,
    modifiedAt: true,
    modifiedBy: true,
    tempsDeMiseEnOeuvre: true,
  })
  .partial();

export type Fiche = InferSelectModel<typeof ficheActionTable>;
