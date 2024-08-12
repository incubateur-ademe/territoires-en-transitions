import { Injectable, Logger } from '@nestjs/common';
import {
  and,
  eq,
  gte,
  inArray,
  InferInsertModel,
  InferSelectModel,
  lte,
  sql,
  SQLWrapper,
} from 'drizzle-orm';
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
import CollectivitesService, {
  collectiviteTable,
} from '../../collectivites/services/collectivites.service';
import DatabaseService from '../../common/services/database.service';
import IndicateurSourcesService, {
  indicateurSourceMetadonneeTable,
} from './indicateurSources.service';

export const indicateurDefinitionTable = pgTable('indicateur_definition', {
  id: serial('id').primaryKey(),
  groupement_id: integer('groupement_id'), // TODO: references
  collectivite_id: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id, {
      onDelete: 'cascade',
    }),
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

@Injectable()
export default class IndicateursService {
  private readonly logger = new Logger(IndicateursService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly indicateurSourcesService: IndicateurSourcesService,
    private readonly collectivitesService: CollectivitesService,
  ) {}

  async getReferentielIndicateursValeurs(
    collectiviteId: number,
    identifiantsReferentiel: string[],
    dateDebut?: string,
    dateFin?: string,
  ) {
    this.logger.log(
      `Récupération des valeurs des indicateurs ${identifiantsReferentiel.join(',')} pour la collectivite ${collectiviteId} et la plage de date ${dateDebut} - ${dateFin}`,
    );
    const conditions: SQLWrapper[] = [
      eq(indicateurValeurTable.collectivite_id, collectiviteId),
      inArray(
        indicateurDefinitionTable.identifiant_referentiel,
        identifiantsReferentiel,
      ),
    ];

    if (dateDebut) {
      conditions.push(gte(indicateurValeurTable.date_valeur, dateDebut));
    }
    if (dateFin) {
      conditions.push(lte(indicateurValeurTable.date_valeur, dateFin));
    }

    return this.databaseService.db
      .select()
      .from(indicateurValeurTable)
      .leftJoin(
        indicateurDefinitionTable,
        eq(indicateurValeurTable.indicateur_id, indicateurDefinitionTable.id),
      )
      .leftJoin(
        indicateurSourceMetadonneeTable,
        eq(
          indicateurValeurTable.metadonnee_id,
          indicateurSourceMetadonneeTable.id,
        ),
      )
      .where(and(...conditions));
  }
}
