import { Injectable, Logger } from '@nestjs/common';
import { demarchePcaetSourceMetadonneeTable } from '@tet/backend/demarches/pcaet/shared/models/demarche-pcaet-source-metadonnee.table';
import { demarchePlanActionTable } from '@tet/backend/demarches/shared/models/demarche-plan-action.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
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
  DemarcheTypeEnum,
  isDemarchePcaetEnCours,
  isDemarchePcaetPublic,
} from '@tet/domain/demarches';
import {
  IndicateurPeriodicite,
  IndicateurPeriodiciteEnum,
  PCAET_COLLECTIVITE_SOURCE_ID,
} from '@tet/domain/indicateurs';
import {
  LigneValeurDepot,
  LigneValeurIndicateurObjectif,
} from '@tet/domain/plans';
import { and, eq, inArray, isNotNull, isNull, ne, or } from 'drizzle-orm';
import { GetPlanError } from '../../get-plan/get-plan.errors';

/** Le dépôt PCAET dont le suivi du plan reprend les indicateurs réglementaires */
export type DepotDuPlan = {
  demarcheId: number;
  metadonneeId: number;
  isPublie: boolean;
};

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

  /**
   * Le dépôt PCAET du plan et la métadonnée de ses valeurs pour la collectivité
   * du plan : la démarche en cours s'il y en a une (un plan n'en a qu'une à la
   * fois), sinon la dernière publiée. `null` sans dépôt ou sans valeur saisie.
   */
  async findDepotDuPlan(
    planId: number,
    collectiviteId: number,
    tx?: Transaction
  ): Promise<Result<DepotDuPlan | null, GetPlanError>> {
    return this.run(async () => {
      const rows = await (tx ?? this.databaseService.db)
        .select({
          demarcheId: demarcheTable.id,
          status: demarcheTable.status,
          publishedAt: demarcheTable.publishedAt,
          metadonneeId: demarchePcaetSourceMetadonneeTable.metadonneeId,
        })
        .from(demarchePlanActionTable)
        .innerJoin(
          demarcheTable,
          eq(demarcheTable.id, demarchePlanActionTable.demarcheId)
        )
        .innerJoin(
          demarchePcaetSourceMetadonneeTable,
          and(
            eq(
              demarchePcaetSourceMetadonneeTable.demarcheId,
              demarchePlanActionTable.demarcheId
            ),
            eq(
              demarchePcaetSourceMetadonneeTable.collectiviteId,
              collectiviteId
            )
          )
        )
        .where(
          and(
            eq(demarchePlanActionTable.planActionId, planId),
            eq(demarcheTable.type, DemarcheTypeEnum.PCAET)
          )
        );
      const [depot] = rows.toSorted(
        (a, b) =>
          Number(isDemarchePcaetEnCours(b.status)) -
            Number(isDemarchePcaetEnCours(a.status)) ||
          (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '')
      );
      return depot
        ? {
            demarcheId: depot.demarcheId,
            metadonneeId: depot.metadonneeId,
            isPublie: isDemarchePcaetPublic(depot.status),
          }
        : null;
    });
  }

  async listIndicateurIdsByIdentifiants(
    identifiants: readonly string[],
    tx?: Transaction
  ): Promise<Result<number[], GetPlanError>> {
    return this.run(async () => {
      const rows = await (tx ?? this.databaseService.db)
        .select({ id: indicateurDefinitionTable.id })
        .from(indicateurDefinitionTable)
        .where(
          inArray(indicateurDefinitionTable.identifiantReferentiel, [
            ...identifiants,
          ])
        );
      return rows.map((row) => row.id);
    });
  }

  /** Résultats et objectifs annuels saisis dans le dépôt PCAET. */
  async listValeursDepot(
    indicateurIds: number[],
    collectiviteId: number,
    metadonneeId: number,
    tx?: Transaction
  ): Promise<
    Result<Array<LigneValeurDepot & { indicateurId: number }>, GetPlanError>
  > {
    if (!indicateurIds.length) {
      return success([]);
    }
    return this.run(() =>
      (tx ?? this.databaseService.db)
        .select({
          indicateurId: indicateurValeurTable.indicateurId,
          dateValeur: indicateurValeurTable.dateValeur,
          resultat: indicateurValeurTable.resultat,
          objectif: indicateurValeurTable.objectif,
        })
        .from(indicateurValeurTable)
        .where(
          and(
            inArray(indicateurValeurTable.indicateurId, indicateurIds),
            eq(indicateurValeurTable.collectiviteId, collectiviteId),
            eq(indicateurValeurTable.metadonneeId, metadonneeId),
            eq(
              indicateurValeurTable.periodicite,
              IndicateurPeriodiciteEnum.ANNUELLE
            ),
            or(
              isNotNull(indicateurValeurTable.resultat),
              isNotNull(indicateurValeurTable.objectif)
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
