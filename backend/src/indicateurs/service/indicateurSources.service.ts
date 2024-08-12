import { Injectable, Logger } from '@nestjs/common';
import { and, eq, InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import DatabaseService from '../../common/services/database.service';

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

@Injectable()
export default class IndicateurSourcesService {
  private readonly logger = new Logger(IndicateurSourcesService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async createIndicateurSourceMetadonnee(
    indicateurSourceMetadonneeType: CreateIndicateurSourceMetadonneeType,
  ) {
    this.logger.log(
      `Création de la metadonnees pour la source d'indicateur ${indicateurSourceMetadonneeType.source_id} et la date ${indicateurSourceMetadonneeType.date_version.toISOString()}`,
    );
    const [model] = await this.databaseService.db
      .insert(indicateurSourceMetadonneeTable)
      .values(indicateurSourceMetadonneeType)
      .returning();
    return model;
  }

  async getIndicateurSourceMetadonnee(
    sourceId: string,
    dateVersion: Date,
  ): Promise<IndicateurSourceMetadonneeType | null> {
    this.logger.log(
      `Récupération de la metadonnees pour la source d'indicateur ${sourceId} et la date ${dateVersion.toISOString()}`,
    );
    const indicateurSourceMetadonnees = await this.databaseService.db
      .select()
      .from(indicateurSourceMetadonneeTable)
      .where(
        and(
          eq(indicateurSourceMetadonneeTable.source_id, sourceId),
          eq(indicateurSourceMetadonneeTable.date_version, dateVersion),
        ),
      )
      .limit(1);
    return indicateurSourceMetadonnees.length > 0
      ? indicateurSourceMetadonnees[0]
      : null;
  }

  async upsertIndicateurSource(indicateurSource: CreateIndicateurSourceType) {
    this.logger.log(`Upsert de la source d'indicateur ${indicateurSource.id}`);
    return this.databaseService.db
      .insert(indicateurSourceTable)
      .values(indicateurSource)
      .onConflictDoUpdate({
        target: indicateurSourceTable.id,
        set: { libelle: indicateurSource.libelle },
      });
  }
}
