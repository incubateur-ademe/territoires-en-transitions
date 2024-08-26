import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { InferInsertModel, InferSelectModel, sql } from 'drizzle-orm';
import {
  boolean,
  date,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../collectivites/models/collectivite.models';

export const indicateurSourceTable = pgTable('indicateur_source', {
  id: text('id').primaryKey(),
  libelle: text('libelle').notNull(),
  ordre_affichage: integer('ordre_affichage'),
});
export type IndicateurSourceType = InferSelectModel<
  typeof indicateurSourceTable
>;
export type CreateIndicateurSourceType = InferInsertModel<
  typeof indicateurSourceTable
>;

export const indicateurSourceMetadonneeTable = pgTable(
  'indicateur_source_metadonnee',
  {
    id: serial('id').primaryKey(),
    source_id: text('source_id')
      .references(() => indicateurSourceTable.id)
      .notNull(),
    date_version: timestamp('date_version').notNull(),
    nom_donnees: text('nom_donnees'),
    diffuseur: text('diffuseur'),
    producteur: text('producteur'),
    methodologie: text('methodologie'),
    limites: text('limites'),
  },
);
export type IndicateurSourceMetadonneeType = InferSelectModel<
  typeof indicateurSourceMetadonneeTable
>;
export type CreateIndicateurSourceMetadonneeType = InferInsertModel<
  typeof indicateurSourceMetadonneeTable
>;

export const indicateurDefinitionTable = pgTable('indicateur_definition', {
  id: serial('id').primaryKey(),
  groupement_id: integer('groupement_id'), // TODO: references
  collectivite_id: integer('collectivite_id').references(
    () => collectiviteTable.id,
    {
      onDelete: 'cascade',
    },
  ),
  identifiant_referentiel: text('identifiant_referentiel').unique(),
  titre: text('titre').notNull(),
  titre_long: text('titre_long'),
  description: text('description'),
  unite: text('unite').notNull(),
  borne_min: doublePrecision('borne_min'),
  borne_max: doublePrecision('borne_max'),
  participation_score: boolean('participation_score').default(false).notNull(),
  sans_valeur_utilisateur: boolean('sans_valeur_utilisateur')
    .default(false)
    .notNull(),
  valeur_calcule: text('valeur_calcule'),
  modified_at: timestamp('modified_at', { withTimezone: true })
    .default(sql.raw(`CURRENT_TIMESTAMP`))
    .notNull(), // with time zone default CURRENT_TIMESTAMP
  created_at: timestamp('created_at', { withTimezone: true })
    .default(sql.raw(`CURRENT_TIMESTAMP`))
    .notNull(), // with time zone default CURRENT_TIMESTAMP
  modified_by: uuid('modified_by'), // TODO: default auth.uid() references auth.users
  created_by: uuid('created_by'), // TODO: default auth.uid() references auth.users
});
export type IndicateurDefinitionType = InferSelectModel<
  typeof indicateurDefinitionTable
>;
export type CreateIndicateurDefinitionType = InferInsertModel<
  typeof indicateurDefinitionTable
>;

export const indicateurValeurTable = pgTable('indicateur_valeur', {
  id: serial('id').primaryKey(),
  collectivite_id: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id, {
      onDelete: 'cascade',
    }),
  indicateur_id: integer('indicateur_id')
    .notNull()
    .references(() => indicateurDefinitionTable.id, {
      onDelete: 'cascade',
    }),
  date_valeur: date('date_valeur').notNull(),
  metadonnee_id: integer('metadonnee_id').references(
    () => indicateurSourceMetadonneeTable.id,
    {
      onDelete: 'cascade',
    },
  ),
  resultat: doublePrecision('resultat'),
  resultat_commentaire: text('resultat_commentaire'),
  objectif: doublePrecision('objectif'),
  objectif_commentaire: text('objectif_commentaire'),
  estimation: doublePrecision('estimation'),
  modified_at: timestamp('modified_at', { withTimezone: true })
    .default(sql.raw(`CURRENT_TIMESTAMP`))
    .notNull(), // with time zone default CURRENT_TIMESTAMP
  created_at: timestamp('created_at', { withTimezone: true })
    .default(sql.raw(`CURRENT_TIMESTAMP`))
    .notNull(), // with time zone default CURRENT_TIMESTAMP
  modified_by: uuid('modified_by'), // TODO: default auth.uid() references auth.users
  created_by: uuid('created_by'), // TODO: default auth.uid() references auth.users
});

export type IndicateurValeurType = InferSelectModel<
  typeof indicateurValeurTable
>;
export type CreateIndicateurValeurType = InferInsertModel<
  typeof indicateurValeurTable
>;

export class IndicateurValeurGroupee implements Partial<IndicateurValeurType> {
  id: number;

  date_valeur: string;

  resultat?: number | null;

  resultat_commentaire?: string | null;

  objectif?: number | null;

  objectif_commentaire?: string | null;

  metadonnee_id?: number | null; // TODO: to be removed
}
export class IndicateurAvecValeurs {
  definition: IndicateurDefinitionType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IndicateurValeurGroupee)
  valeurs: IndicateurValeurGroupee[];
}

export class IndicateurValeurAvecMetadonnesDefinition {
  indicateur_valeur: IndicateurValeurType;

  indicateur_definition: IndicateurDefinitionType | null;

  indicateur_source_metadonnee: IndicateurSourceMetadonneeType | null;
}
