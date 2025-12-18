import { InferSelectModel } from 'drizzle-orm';
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
  ciblesEnumValues,
  ficheActionResultatsAttenduValues,
  participationCitoyenneEnumValues,
  piliersEciEnumValues,
  prioriteEnumValues,
  StatutEnum,
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
  piliersEci: varchar('piliers_eci', {
    length: 50,
    enum: piliersEciEnumValues,
  }).array(),
  objectifs: varchar('objectifs', { length: 10000 }),
  cibles: varchar('cibles', { length: 50, enum: ciblesEnumValues }).array(),
  ressources: varchar('ressources', { length: 10000 }),
  financements: text('financements'),
  budgetPrevisionnel: numeric('budget_previsionnel', {
    precision: 12,
    scale: 0,
  }), // budgetPrevisionnel deprecated
  statut: varchar('statut', { length: 30, enum: statutsEnumValues }).default(
    StatutEnum.A_VENIR
  ),
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
  ameliorationContinue: (schema) =>
    schema.describe('Action se répète tous les ans'),
  budgetPrevisionnel: (schema) => schema.describe('Budget prévisionnel total'),
  restreint: (schema) => schema.describe('Confidentialité'),
  statut: (schema) => schema.describe('Statut'),
  priorite: (schema) => schema.describe('Priorité'),
  participationCitoyenneType: (schema) =>
    schema.describe('Participation citoyenne'),
  dateDebut: (schema) => schema.describe('Date de début'),
  dateFin: (schema) => schema.describe('Date de fin prévisionnelle'),
  createdAt: (schema) => schema.describe('Date de création'),
  modifiedAt: (schema) => schema.describe('Date de modification'),
});

export const ficheSchemaCreate = createInsertSchema(ficheActionTable);

export type FicheCreate = z.infer<typeof ficheSchemaCreate>;

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
