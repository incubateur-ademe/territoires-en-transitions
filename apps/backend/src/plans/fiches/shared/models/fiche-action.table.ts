import {
  cibleEnumValues,
  FicheReferenceKind,
  participationCitoyenneEnumValues,
  piliersEciEnumValues,
  PrioriteEnum,
  PlanReferenceProgramme,
  StatutEnum,
  statutEnumValues,
} from '@tet/domain/plans';
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
import { collectiviteTable } from '../../../../collectivites/shared/models/collectivite.table';
import { tempsDeMiseEnOeuvreTable } from '../../../../shared/models/temps-de-mise-en-oeuvre.table';
import {
  createdAt,
  createdBy,
  modifiedAt,
  modifiedBy,
  TIMESTAMP_OPTIONS,
} from '../../../../utils/column.utils';
import { ficheActionResultatsAttenduValues } from './fiche-action-resultats-attendus.enum';

export const ficheActionResultatsAttendusEnum = pgEnum(
  'fiche_action_resultats_attendus',
  ficheActionResultatsAttenduValues
);

export const prioritePgEnum = pgEnum(
  'fiche_action_niveaux_priorite',
  PrioriteEnum
);

export const ficheActionTable = pgTable('fiche_action', {
  id: serial('id').primaryKey().notNull(),
  parentId: integer('parent_id'),
  referenceProgramme: text(
    'reference_programme'
  ).$type<PlanReferenceProgramme>(),
  referenceKind: text('reference_kind').$type<FicheReferenceKind>(),
  referenceCode: text('reference_code'),
  referenceParentCode: text('reference_parent_code'),
  titre: varchar('titre', { length: 300 }).default('Nouvelle action'),
  description: varchar('description', { length: 20000 }),
  piliersEci: varchar('piliers_eci', {
    length: 50,
    enum: piliersEciEnumValues,
  }).array(),
  objectifs: varchar('objectifs', { length: 10000 }),
  cibles: varchar('cibles', { length: 50, enum: cibleEnumValues }).array(),
  ressources: varchar('ressources', { length: 10000 }),
  financements: text('financements'),
  budgetPrevisionnel: numeric('budget_previsionnel', {
    precision: 12,
    scale: 0,
  }), // budgetPrevisionnel deprecated
  statut: varchar('statut', { length: 30, enum: statutEnumValues }).default(
    StatutEnum.A_VENIR
  ),
  jauge: integer('jauge').notNull().default(0),
  priorite: prioritePgEnum('niveau_priorite'),
  dateDebut: timestamp('date_debut', TIMESTAMP_OPTIONS),
  dateFin: timestamp('date_fin_provisoire', TIMESTAMP_OPTIONS),
  ameliorationContinue: boolean('amelioration_continue'),
  //@deprecated use instanceGouvernanceTags table instead
  deprecatedInstanceGouvernance: text('instance_gouvernance'),
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
  deleted: boolean('deleted').default(false),
  restreint: boolean('restreint').default(false),
});
