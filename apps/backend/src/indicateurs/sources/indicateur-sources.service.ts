import { Injectable, Logger } from '@nestjs/common';
import { and, asc, eq, inArray, isNotNull, or } from 'drizzle-orm';
import { DatabaseService } from '../../utils/database/database.service';
import {
  indicateurSourceMetadonneeTable,
  SourceMetadonnee,
  SourceMetadonneeInsert,
} from '../shared/models/indicateur-source-metadonnee.table';
import {
  indicateurSourceTable,
  SourceInsert,
} from '../shared/models/indicateur-source.table';
import { indicateurValeurTable } from '../valeurs/indicateur-valeur.table';
import { GetAvailableSourcesRequestSchemaRequestType } from './get-available-sources.request';

@Injectable()
export default class IndicateurSourcesService {
  private readonly logger = new Logger(IndicateurSourcesService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async createIndicateurSourceMetadonnee(
    indicateurSourceMetadonneeType: SourceMetadonneeInsert
  ) {
    this.logger.log(
      `Création de la metadonnees pour la source d'indicateur ${indicateurSourceMetadonneeType.sourceId} et la date ${indicateurSourceMetadonneeType.dateVersion}`
    );
    const request = this.databaseService.db
      .insert(indicateurSourceMetadonneeTable)
      .values(indicateurSourceMetadonneeType)
      .onConflictDoNothing();

    const [model] = await request.returning();
    return model;
  }

  async getAllIndicateurSourceMetadonnees(): Promise<SourceMetadonnee[]> {
    this.logger.log(`Get all metadonnees for indicateur sources`);
    const indicateurSourceMetadonnees = await this.databaseService.db
      .select()
      .from(indicateurSourceMetadonneeTable);

    this.logger.log(
      `Found ${indicateurSourceMetadonnees.length} metadonnees for indicateur sources`
    );
    return indicateurSourceMetadonnees;
  }

  async getIndicateurSourceMetadonnee(
    sourceId: string,
    dateVersion: string
  ): Promise<SourceMetadonnee | null> {
    this.logger.log(
      `Récupération de la metadonnees pour la source d'indicateur ${sourceId} et la date ${dateVersion}`
    );
    const indicateurSourceMetadonnees = await this.databaseService.db
      .select()
      .from(indicateurSourceMetadonneeTable)
      .where(
        and(
          eq(indicateurSourceMetadonneeTable.sourceId, sourceId),
          eq(indicateurSourceMetadonneeTable.dateVersion, dateVersion)
        )
      )
      .limit(1);
    return indicateurSourceMetadonnees.length > 0
      ? indicateurSourceMetadonnees[0]
      : null;
  }

  async upsertIndicateurSource(indicateurSource: SourceInsert) {
    this.logger.log(`Upsert de la source d'indicateur ${indicateurSource.id}`);
    return this.databaseService.db
      .insert(indicateurSourceTable)
      .values(indicateurSource)
      .onConflictDoUpdate({
        target: indicateurSourceTable.id,
        set: { libelle: indicateurSource.libelle },
      });
  }

  async getAllSources() {
    this.logger.log('Liste toutes les sources de données');
    return this.databaseService.db
      .select()
      .from(indicateurSourceTable)
      .orderBy(
        asc(indicateurSourceTable.ordreAffichage),
        asc(indicateurSourceTable.libelle)
      );
  }

  async getAvailableSources(
    input: GetAvailableSourcesRequestSchemaRequestType
  ) {
    const { collectiviteId, indicateurId } = input;
    this.logger.log(
      `Liste les sources de données disponibles pour l'indicateur ${indicateurId} et la collectivité ${collectiviteId}`
    );

    const metadonneeIds = this.databaseService.db
      .select({ id: indicateurValeurTable.metadonneeId })
      .from(indicateurValeurTable)
      .where(
        and(
          isNotNull(indicateurValeurTable.metadonneeId),
          eq(indicateurValeurTable.collectiviteId, collectiviteId),
          eq(indicateurValeurTable.indicateurId, indicateurId),
          or(
            isNotNull(indicateurValeurTable.resultat),
            isNotNull(indicateurValeurTable.objectif)
          )
        )
      );

    const sourceId = this.databaseService.db
      .selectDistinct({ sourceId: indicateurSourceMetadonneeTable.sourceId })
      .from(indicateurSourceMetadonneeTable)
      .where(inArray(indicateurSourceMetadonneeTable.id, metadonneeIds));

    return this.databaseService.db
      .select()
      .from(indicateurSourceTable)
      .where(inArray(indicateurSourceTable.id, sourceId))
      .orderBy(
        asc(indicateurSourceTable.ordreAffichage),
        asc(indicateurSourceTable.libelle)
      );
  }
}
