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

export const PiliersEciEnum = {
  APPROVISIONNEMENT_DURABLE: 'Approvisionnement durable',
  ECOCONCEPTION: 'Écoconception',
  ECOLOGIE_INDUSTRIELLE: 'Écologie industrielle (et territoriale)',
  ECONOMIE_DE_LA_FONCTIONNALITE: 'Économie de la fonctionnalité',
  CONSOMMATION_RESPONSABLE: 'Consommation responsable',
  ALLONGEMENT_DUREE_USAGE: 'Allongement de la durée d’usage',
  RECYCLAGE: 'Recyclage',
} as const;

export const piliersEciEnumValues = [
  PiliersEciEnum.APPROVISIONNEMENT_DURABLE,
  PiliersEciEnum.ECOCONCEPTION,
  PiliersEciEnum.ECOLOGIE_INDUSTRIELLE,
  PiliersEciEnum.ECONOMIE_DE_LA_FONCTIONNALITE,
  PiliersEciEnum.CONSOMMATION_RESPONSABLE,
  PiliersEciEnum.ALLONGEMENT_DUREE_USAGE,
  PiliersEciEnum.RECYCLAGE,
] as const;

export const piliersEciEnumSchema = z.enum(piliersEciEnumValues);

export const piliersEciPgEnum = pgEnum(
  'fiche_action_piliers_eci',
  PiliersEciEnum
);

export enum ficheActionResultatsAttendusEnumType {
  ADAPTATION_CHANGEMENT_CLIMATIQUE = 'Adaptation au changement climatique',
  ALLONGEMENT_DUREE_USAGE = 'Allongement de la durée d’usage',
  AMELIORATION_QUALITE_VIE = 'Amélioration de la qualité de vie',
  DEVELOPPEMENT_ENERGIES_RENOUVELABLES = 'Développement des énergies renouvelables',
  EFFICACITE_ENERGETIQUE = 'Efficacité énergétique',
  PRESERVATION_BIODIVERSITE = 'Préservation de la biodiversité',
  REDUCTION_CONSOMMATIONS_ENERGETIQUES = 'Réduction des consommations énergétiques',
  REDUCTION_DECHETS = 'Réduction des déchets',
  REDUCTION_EMISSIONS_GES = 'Réduction des émissions de gaz à effet de serre',
  REDUCTION_POLLUANTS_ATMOSPHERIQUES = 'Réduction des polluants atmosphériques',
  SOBRIETE_ENERGETIQUE = 'Sobriété énergétique',
}
export const ficheActionResultatsAttenduValues = Object.values(
  ficheActionResultatsAttendusEnumType
) as [
  ficheActionResultatsAttendusEnumType,
  ...ficheActionResultatsAttendusEnumType[]
];
export const ficheActionResultatsAttendusEnum = pgEnum(
  'fiche_action_resultats_attendus',
  ficheActionResultatsAttenduValues
);

export const StatutEnum = {
  A_VENIR: 'À venir',
  EN_COURS: 'En cours',
  REALISE: 'Réalisé',
  EN_PAUSE: 'En pause',
  ABANDONNE: 'Abandonné',
  BLOQUE: 'Bloqué',
  EN_RETARD: 'En retard',
  A_DISCUTER: 'A discuter',
} as const;
export const statutsEnumValues = [
  StatutEnum.A_VENIR,
  StatutEnum.EN_COURS,
  StatutEnum.REALISE,
  StatutEnum.EN_PAUSE,
  StatutEnum.ABANDONNE,
  StatutEnum.BLOQUE,
  StatutEnum.EN_RETARD,
  StatutEnum.A_DISCUTER,
] as const;
export const statutsEnumSchema = z.enum(statutsEnumValues);
export const statutsPgEnum = pgEnum('fiche_action_statuts', statutsEnumValues);
export type Statut = z.infer<typeof statutsEnumSchema>;

export const ciblesEnumValues = [
  'Grand public',
  'Associations',
  'Grand public et associations',
  'Public Scolaire',
  'Autres collectivités du territoire',
  'Acteurs économiques',
  'Acteurs économiques du secteur primaire',
  'Acteurs économiques du secteur secondaire',
  'Acteurs économiques du secteur tertiaire',
  'Partenaires',
  'Collectivité elle-même',
  'Elus locaux',
  'Agents',
] as const;
export const ciblesEnumSchema = z.enum(ciblesEnumValues);
export const ciblesPgEnum = pgEnum('fiche_action_cibles', ciblesEnumValues);
export type Cible = z.infer<typeof ciblesEnumSchema>;

export const prioriteEnumValues = ['Élevé', 'Moyen', 'Bas'] as const;
export const prioriteEnumSchema = z.enum(prioriteEnumValues);
export const prioritePgEnum = pgEnum(
  'fiche_action_niveaux_priorite',
  prioriteEnumValues
);
export type Priorite = z.infer<typeof prioriteEnumSchema>;

export const participationCitoyenneEnumValues = [
  'pas-de-participation',
  'information',
  'consultation',
  'concertation',
  'co-construction',
] as const;
export const participationCitoyenneEnumSchema = z.enum(
  participationCitoyenneEnumValues
);
export type ParticipationCitoyenne = z.infer<
  typeof participationCitoyenneEnumSchema
>;

export const ficheActionTable = pgTable('fiche_action', {
  id: serial('id').primaryKey().notNull(),
  parentId: integer('parent_id'),
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
  deleted: boolean('deleted').default(false),
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
