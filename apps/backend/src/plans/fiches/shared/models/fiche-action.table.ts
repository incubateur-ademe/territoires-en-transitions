import {
  cibleEnumValues,
  participationCitoyenneEnumValues,
  piliersEciEnumValues,
  PrioriteEnum,
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

export const prioritePgEnum = pgEnum(
  'fiche_action_niveaux_priorite',
  PrioriteEnum
);

export const ficheActionTable = pgTable('fiche_action', {
  id: serial('id').primaryKey().notNull(),
  parentId: integer('parent_id'),
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
  priorite: prioritePgEnum('niveau_priorite'),
  dateDebut: timestamp('date_debut', TIMESTAMP_OPTIONS),
  dateFin: timestamp('date_fin_provisoire', TIMESTAMP_OPTIONS),
  ameliorationContinue: boolean('amelioration_continue'),
  calendrier: varchar('calendrier', { length: 10000 }),
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
