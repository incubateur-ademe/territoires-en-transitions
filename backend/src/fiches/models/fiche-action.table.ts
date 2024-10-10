import { InferInsertModel, sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const ficheActionPiliersEciEnum = pgEnum('fiche_action_piliers_eci', [
  'Approvisionnement durable',
  'Écoconception',
  'Écologie industrielle (et territoriale)',
  'Économie de la fonctionnalité',
  'Consommation responsable',
  'Allongement de la durée d’usage',
  'Recyclage',
]);

export const ficheActionResultatsAttendusEnum = pgEnum(
  'fiche_action_resultats_attendus',
  [
    'Adaptation au changement climatique',
    'Allongement de la durée d’usage',
    'Amélioration de la qualité de vie',
    'Développement des énergies renouvelables',
    'Efficacité énergétique',
    'Préservation de la biodiversité',
    'Réduction des consommations énergétiques',
    'Réduction des déchets',
    'Réduction des émissions de gaz à effet de serre',
    'Réduction des polluants atmosphériques',
    'Sobriété énergétique',
  ],
);

export enum FicheActionStatutsEnumType {
  A_VENIR = 'À venir',
  EN_COURS = 'En cours',
  REALISE = 'Réalisé',
  EN_PAUSE = 'En pause',
  ABANDONNE = 'Abandonné',
}

export const ficheActionStatutsEnum = pgEnum('fiche_action_statuts', [
  FicheActionStatutsEnumType.A_VENIR,
  FicheActionStatutsEnumType.EN_COURS,
  FicheActionStatutsEnumType.REALISE,
  FicheActionStatutsEnumType.EN_PAUSE,
  FicheActionStatutsEnumType.ABANDONNE,
]);

export enum FicheActionCiblesEnumType {
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

export const ficheActionCiblesEnum = pgEnum('fiche_action_cibles', [
  FicheActionCiblesEnumType.GRAND_PUBLIC_ET_ASSOCIATIONS,
  FicheActionCiblesEnumType.PUBLIC_SCOLAIRE,
  FicheActionCiblesEnumType.AUTRES_COLLECTIVITES_DU_TERRITOIRE,
  FicheActionCiblesEnumType.ACTEURS_ECONOMIQUES,
  FicheActionCiblesEnumType.ACTEURS_ECONOMIQUES_DU_SECTEUR_PRIMAIRE,
  FicheActionCiblesEnumType.ACTEURS_ECONOMIQUES_DU_SECTEUR_SECONDAIRE,
  FicheActionCiblesEnumType.ACTEURS_ECONOMIQUES_DU_SECTEUR_TERTIAIRE,
  FicheActionCiblesEnumType.PARTENAIRES,
  FicheActionCiblesEnumType.COLLECTIVITE_ELLE_MEME,
  FicheActionCiblesEnumType.ELUS_LOCAUX,
  FicheActionCiblesEnumType.AGENTS,
]);

export const ficheActionNiveauxPrioriteEnum = pgEnum(
  'fiche_action_niveaux_priorite',
  ['Élevé', 'Moyen', 'Bas'],
);

export const ficheActionTable = pgTable('fiche_action', {
  modifiedAt: timestamp('modified_at', { withTimezone: true, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  id: serial('id').primaryKey().notNull(),
  titre: varchar('titre', { length: 300 }).default('Nouvelle fiche'),
  description: varchar('description', { length: 20000 }),
  piliersEci: ficheActionPiliersEciEnum('piliers_eci').array(),
  objectifs: varchar('objectifs', { length: 10000 }),
  resultatsAttendus:
    ficheActionResultatsAttendusEnum('resultats_attendus').array(),
  cibles: ficheActionCiblesEnum('cibles').array(),
  ressources: varchar('ressources', { length: 10000 }),
  financements: text('financements'),
  budgetPrevisionnel: numeric('budget_previsionnel', {
    precision: 12,
    scale: 0,
  }),
  statut: ficheActionStatutsEnum('statut').default(
    FicheActionStatutsEnumType.A_VENIR,
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
  majTermine: boolean('maj_termine'),
  collectiviteId: integer('collectivite_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  modifiedBy: uuid('modified_by').default(sql`auth.uid()`),
  restreint: boolean('restreint').default(false),
});
export type FicheActionTableType = typeof ficheActionTable;
export type CreateFicheActionType = InferInsertModel<typeof ficheActionTable>;
