import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  IndicateurSourceCreate,
  IndicateurSourceMetadonnee,
  IndicateurSourceMetadonneeCreate,
} from '@tet/domain/indicateurs';
import { and, asc, eq, inArray, isNotNull, or } from 'drizzle-orm';
import { indicateurSourceMetadonneeTable } from '../shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '../shared/models/indicateur-source.table';
import { indicateurValeurTable } from '../valeurs/indicateur-valeur.table';

type IndicateurAvailableSourcesScope = Readonly<{
  collectiviteId: number;
  indicateurId: number;
}>;

@Injectable()
export class IndicateurSourcesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async createMetadonnee(
    metadonnee: IndicateurSourceMetadonneeCreate,
    tx?: Transaction
  ) {
    const [created] = await (tx ?? this.databaseService.db)
      .insert(indicateurSourceMetadonneeTable)
      .values(metadonnee)
      .onConflictDoNothing()
      .returning();
    return created;
  }

  listMetadonnees(tx?: Transaction): Promise<IndicateurSourceMetadonnee[]> {
    return (tx ?? this.databaseService.db)
      .select()
      .from(indicateurSourceMetadonneeTable);
  }

  async getMetadonnee(
    sourceId: string,
    dateVersion: string,
    tx?: Transaction
  ): Promise<IndicateurSourceMetadonnee | null> {
    const [metadonnee] = await (tx ?? this.databaseService.db)
      .select()
      .from(indicateurSourceMetadonneeTable)
      .where(
        and(
          eq(indicateurSourceMetadonneeTable.sourceId, sourceId),
          eq(indicateurSourceMetadonneeTable.dateVersion, dateVersion)
        )
      )
      .limit(1);
    return metadonnee ?? null;
  }

  upsertSource(source: IndicateurSourceCreate, tx?: Transaction) {
    return (tx ?? this.databaseService.db)
      .insert(indicateurSourceTable)
      .values(source)
      .onConflictDoUpdate({
        target: indicateurSourceTable.id,
        set: { libelle: source.libelle },
      });
  }

  listSources(tx?: Transaction) {
    return (tx ?? this.databaseService.db)
      .select()
      .from(indicateurSourceTable)
      .orderBy(
        asc(indicateurSourceTable.ordreAffichage),
        asc(indicateurSourceTable.libelle)
      );
  }

  listAvailableSources(
    { collectiviteId, indicateurId }: IndicateurAvailableSourcesScope,
    tx?: Transaction
  ) {
    const database = tx ?? this.databaseService.db;
    const metadonneeIds = database
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

    const sourceIds = database
      .selectDistinct({ sourceId: indicateurSourceMetadonneeTable.sourceId })
      .from(indicateurSourceMetadonneeTable)
      .where(inArray(indicateurSourceMetadonneeTable.id, metadonneeIds));

    return database
      .select()
      .from(indicateurSourceTable)
      .where(inArray(indicateurSourceTable.id, sourceIds))
      .orderBy(
        asc(indicateurSourceTable.ordreAffichage),
        asc(indicateurSourceTable.libelle)
      );
  }
}
