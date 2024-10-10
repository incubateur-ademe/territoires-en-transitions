import { Injectable, Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import DatabaseService from '../../common/services/database.service';
import {
  CreateIndicateurSourceMetadonneeType,
  indicateurSourceMetadonneeTable,
  IndicateurSourceMetadonneeType,
} from '../models/indicateur-source-metadonnee.table';
import {
  CreateIndicateurSourceType,
  indicateurSourceTable,
} from '../models/indicateur-source.table';

@Injectable()
export default class IndicateurSourcesService {
  private readonly logger = new Logger(IndicateurSourcesService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async createIndicateurSourceMetadonnee(
    indicateurSourceMetadonneeType: CreateIndicateurSourceMetadonneeType,
  ) {
    this.logger.log(
      `Création de la metadonnees pour la source d'indicateur ${indicateurSourceMetadonneeType.sourceId} et la date ${indicateurSourceMetadonneeType.dateVersion.toISOString()}`,
    );
    const request = this.databaseService.db
      .insert(indicateurSourceMetadonneeTable)
      .values(indicateurSourceMetadonneeType)
      .onConflictDoNothing();

    const [model] = await request.returning();
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
          eq(indicateurSourceMetadonneeTable.sourceId, sourceId),
          eq(indicateurSourceMetadonneeTable.dateVersion, dateVersion),
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
