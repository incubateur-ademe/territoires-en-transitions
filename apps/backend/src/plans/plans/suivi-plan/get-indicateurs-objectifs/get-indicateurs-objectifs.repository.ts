import { Injectable, Logger } from '@nestjs/common';
import { indicateurCollectiviteTable } from '@tet/backend/indicateurs/indicateur/indicateur-collectivite.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/indicateur/indicateur-definition.table';
import { indicateurSourceMetadonneeTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '@tet/backend/indicateurs/shared/models/indicateur-source.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { axeIndicateurTable } from '@tet/backend/plans/fiches/shared/models/axe-indicateur.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  IndicateurPeriodicite,
  PCAET_COLLECTIVITE_SOURCE_ID,
} from '@tet/domain/indicateurs';
import { LigneValeurIndicateurObjectif } from '@tet/domain/plans';
import { and, eq, inArray, isNotNull, isNull, ne, or } from 'drizzle-orm';
import { GetPlanError } from '../../get-plan/get-plan.errors';

export type IndicateurObjectifDefinition = {
  id: number;
  identifiantReferentiel: string | null;
  titre: string;
  unite: string;
  precision: number;
  periodicite: IndicateurPeriodicite;
  confidentiel: boolean;
  favori: boolean;
};

@Injectable()
export class GetIndicateursObjectifsRepository {
  private readonly logger = new Logger(GetIndicateursObjectifsRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async listAxeIndicateurIds(
    axeIds: number[],
    tx?: Transaction
  ): Promise<Result<number[], GetPlanError>> {
    if (!axeIds.length) {
      return success([]);
    }
    return this.run(async () => {
      const rows = await (tx ?? this.databaseService.db)
        .selectDistinct({ indicateurId: axeIndicateurTable.indicateurId })
        .from(axeIndicateurTable)
        .where(inArray(axeIndicateurTable.axeId, axeIds));
      return rows.map((row) => row.indicateurId);
    });
  }

  async listDefinitions(
    indicateurIds: number[],
    collectiviteId: number,
    tx?: Transaction
  ): Promise<Result<IndicateurObjectifDefinition[], GetPlanError>> {
    if (!indicateurIds.length) {
      return success([]);
    }
    return this.run(async () => {
      const rows = await (tx ?? this.databaseService.db)
        .select({
          id: indicateurDefinitionTable.id,
          identifiantReferentiel:
            indicateurDefinitionTable.identifiantReferentiel,
          titre: indicateurDefinitionTable.titre,
          unite: indicateurDefinitionTable.unite,
          precision: indicateurDefinitionTable.precision,
          periodicite: indicateurDefinitionTable.periodicite,
          confidentiel: indicateurCollectiviteTable.confidentiel,
          favori: indicateurCollectiviteTable.favoris,
        })
        .from(indicateurDefinitionTable)
        .leftJoin(
          indicateurCollectiviteTable,
          and(
            eq(
              indicateurCollectiviteTable.indicateurId,
              indicateurDefinitionTable.id
            ),
            eq(indicateurCollectiviteTable.collectiviteId, collectiviteId)
          )
        )
        .where(inArray(indicateurDefinitionTable.id, indicateurIds));
      return rows.map((row) => ({
        ...row,
        confidentiel: row.confidentiel ?? false,
        favori: row.favori ?? false,
      }));
    });
  }

  /**
   * Résultats et objectifs de la collectivité, toutes sources sauf le dépôt
   * PCAET (repris par les indicateurs réglementaires), en une seule requête.
   */
  async listValeurs(
    indicateurIds: number[],
    collectiviteId: number,
    tx?: Transaction
  ): Promise<
    Result<
      Array<LigneValeurIndicateurObjectif & { indicateurId: number }>,
      GetPlanError
    >
  > {
    if (!indicateurIds.length) {
      return success([]);
    }
    return this.run(() =>
      (tx ?? this.databaseService.db)
        .select({
          indicateurId: indicateurValeurTable.indicateurId,
          periodicite: indicateurValeurTable.periodicite,
          dateValeur: indicateurValeurTable.dateValeur,
          resultat: indicateurValeurTable.resultat,
          objectif: indicateurValeurTable.objectif,
          metadonneeId: indicateurValeurTable.metadonneeId,
          sourceId: indicateurSourceMetadonneeTable.sourceId,
          sourceLibelle: indicateurSourceTable.libelle,
          ordreAffichage: indicateurSourceTable.ordreAffichage,
          dateVersion: indicateurSourceMetadonneeTable.dateVersion,
        })
        .from(indicateurValeurTable)
        .leftJoin(
          indicateurSourceMetadonneeTable,
          eq(
            indicateurValeurTable.metadonneeId,
            indicateurSourceMetadonneeTable.id
          )
        )
        .leftJoin(
          indicateurSourceTable,
          eq(indicateurSourceMetadonneeTable.sourceId, indicateurSourceTable.id)
        )
        .where(
          and(
            inArray(indicateurValeurTable.indicateurId, indicateurIds),
            eq(indicateurValeurTable.collectiviteId, collectiviteId),
            or(
              isNotNull(indicateurValeurTable.resultat),
              isNotNull(indicateurValeurTable.objectif)
            ),
            or(
              isNull(indicateurValeurTable.metadonneeId),
              ne(
                indicateurSourceMetadonneeTable.sourceId,
                PCAET_COLLECTIVITE_SOURCE_ID
              )
            )
          )
        )
    );
  }

  private async run<T>(
    query: () => Promise<T>
  ): Promise<Result<T, GetPlanError>> {
    try {
      return success(await query());
    } catch (error) {
      this.logger.error(error);
      return failure(
        'DATABASE_ERROR',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
