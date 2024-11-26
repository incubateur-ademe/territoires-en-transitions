import { InferInsertModel } from 'drizzle-orm';
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
import { collectiviteTable } from '../../collectivites/models/collectivite.table';
import {
  createdAt,
  modifiedAt,
  modifiedBy,
} from '../../common/models/column.helpers';
import { tempsDeMiseEnOeuvreTable } from '../../taxonomie/models/temps-de-mise-en-oeuvre.table';

export enum piliersEciEnumType {
  APPROVISIONNEMENT_DURABLE = 'Approvisionnement durable',
  ECOCONCEPTION = 'Écoconception',
  ECOLOGIE_INDUSTRIELLE = 'Écologie industrielle (et territoriale)',
  ECONOMIE_DE_LA_FONCTIONNALITE = 'Économie de la fonctionnalité',
  CONSOMMATION_RESPONSABLE = 'Consommation responsable',
  ALLONGEMENT_DUREE_USAGE = 'Allongement de la durée d’usage',
  RECYCLAGE = 'Recyclage',
}

export const piliersEciEnumValues = Object.values(piliersEciEnumType) as [
  piliersEciEnumType,
  ...piliersEciEnumType[]
];

export const piliersEciEnumSchema = z.enum(piliersEciEnumValues);

export const piliersEciPgEnum = pgEnum(
  'fiche_action_piliers_eci',
  piliersEciEnumValues
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

export const ficheActionResultatsAttendusEnum = pgEnum(
  'fiche_action_resultats_attendus',
  Object.values(ficheActionResultatsAttendusEnumType) as [
    ficheActionResultatsAttendusEnumType,
    ...ficheActionResultatsAttendusEnumType[]
  ]
);

export enum FicheActionStatutsEnumType {
  A_VENIR = 'À venir',
  EN_COURS = 'En cours',
  REALISE = 'Réalisé',
  EN_PAUSE = 'En pause',
  ABANDONNE = 'Abandonné',
  BLOQUE = 'Bloqué',
  EN_RETARD = 'En retard',
  A_DISCUTER = 'A discuter',
}

export const SANS_STATUT_FICHE_ACTION_SYNTHESE_KEY = 'Sans statut';

export const ficheActionStatutsEnum = pgEnum(
  'fiche_action_statuts',
  Object.values(FicheActionStatutsEnumType) as [
    FicheActionStatutsEnumType,
    ...FicheActionStatutsEnumType[]
  ]
);

export enum FicheActionCiblesEnumType {
  GRAND_PUBLIC = 'Grand public',
  ASSOCIATIONS = 'Associations',
  GRAND_PUBLIC_ET_ASSOCIATIONS = 'Grand public et associations',
  PUBLIC_SCOLAIRE = 'Public Scolaire',
  AUTRES_COLLECTIVITES_DU_TERRITOIRE = 'Autres collectivités du territoire',
  ACTEURS_ECONOMIQUES = 'Acteurs économiques',
  ACTEURS_ECONOMIQUES_DU_SECTEUR_PRIMAIRE = 'Acteurs économiques du secteur primaire',
  ACTEURS_ECONOMIQUES_DU_SECTEUR_SECONDAIRE = 'Acteurs économiques du secteur secondaire',
  ACTEURS_ECONOMIQUES_DU_SECTEUR_TERTIAIRE = 'Acteurs économiques du secteur tertiaire',
  PARTENAIRES = 'Partenaires',
  COLLECTIVITE_ELLE_MEME = 'Collectivité elle-même',
  ELUS_LOCAUX = 'Elus locaux',
  AGENTS = 'Agents',
}

export const ficheActionCiblesEnumValues = Object.values(
  FicheActionCiblesEnumType
) as [FicheActionCiblesEnumType, ...FicheActionCiblesEnumType[]];

export const ficheActionCiblesEnumSchema = z.enum(ficheActionCiblesEnumValues);

export const ficheActionCiblesEnum = pgEnum(
  'fiche_action_cibles',
  ficheActionCiblesEnumValues
);

export const ficheActionNiveauxPrioriteEnum = pgEnum(
  'fiche_action_niveaux_priorite',
  ['Élevé', 'Moyen', 'Bas']
);

export const ficheActionParticipationCitoyenneTypeEnumValues = [
  'pas-de-participation',
  'information',
  'consultation',
  'concertation',
  'co-construction',
] as const;

export const ficheActionTable = pgTable('fiche_action', {
  id: serial('id').primaryKey().notNull(),
  titre: varchar('titre', { length: 300 }).default('Nouvelle fiche'),
  description: varchar('description', { length: 20000 }),
  piliersEci: piliersEciPgEnum('piliers_eci').array(),
  objectifs: varchar('objectifs', { length: 10000 }),
  cibles: text('cibles', {
    enum: ficheActionCiblesEnumValues,
  }).array(),
  ressources: varchar('ressources', { length: 10000 }),
  financements: text('financements'),
  budgetPrevisionnel: numeric('budget_previsionnel', {
    precision: 12,
    scale: 0,
  }),
  statut: ficheActionStatutsEnum('statut').default(
    FicheActionStatutsEnumType.A_VENIR
  ),
  niveauPriorite: ficheActionNiveauxPrioriteEnum('niveau_priorite'),
  dateDebut: timestamp('date_debut', { withTimezone: true, mode: 'string' }),
  dateFinProvisoire: timestamp('date_fin_provisoire', {
    withTimezone: true,
    mode: 'string',
  }),
  ameliorationContinue: boolean('amelioration_continue'),
  calendrier: varchar('calendrier', { length: 10000 }),
  notesComplementaires: varchar('notes_complementaires', { length: 20000 }),
  instanceGouvernance: text('instance_gouvernance'),
  participationCitoyenne: text('participation_citoyenne'),
  participationCitoyenneType: varchar('participation_citoyenne_type', {
    length: 30,
    enum: ficheActionParticipationCitoyenneTypeEnumValues,
  }),
  tempsDeMiseEnOeuvre: integer('temps_de_mise_en_oeuvre_id').references(
    () => tempsDeMiseEnOeuvreTable.niveau
  ),
  majTermine: boolean('maj_termine'),
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
  createdAt,
  modifiedAt,
  modifiedBy,
  restreint: boolean('restreint').default(false),
});

export type FicheActionTableType = typeof ficheActionTable;

export type CreateFicheActionType = InferInsertModel<typeof ficheActionTable>;

export const ficheActionSchema = createSelectSchema(ficheActionTable, {
  // Overriding array types as a workaround for drizzle-zod parsing issue
  // See https://github.com/drizzle-team/drizzle-orm/issues/1609
  piliersEci: z.array(piliersEciEnumSchema),
  cibles: z.array(ficheActionCiblesEnumSchema),
});

export const createFicheActionSchema = createInsertSchema(ficheActionTable, {
  // Overriding array types as a workaround for drizzle-zod parsing issue
  // See https://github.com/drizzle-team/drizzle-orm/issues/1609
  piliersEci: z.array(piliersEciEnumSchema),
  cibles: z.array(ficheActionCiblesEnumSchema),
});

export const updateFicheActionSchema = createFicheActionSchema
  .omit({ id: true, createdAt: true, modifiedAt: true, modifiedBy: true })
  .partial();

export type UpdateFicheActionType = z.infer<typeof updateFicheActionSchema>;
