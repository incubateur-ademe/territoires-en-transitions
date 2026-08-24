import { Injectable, Logger } from '@nestjs/common';
import { demarchePlanActionTable } from '@tet/backend/demarches/shared/models/demarche-plan-action.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { DEMARCHE_PCAET_ACTIVE_STATUSES } from '@tet/domain/demarches';
import { and, asc, eq, inArray, ne } from 'drizzle-orm';

/** Autre démarche active tenant déjà un plan que l'on cherche à rattacher. */
export type DemarcheHoldingPlan = {
  planActionId: number;
  demarcheId: number;
  titre: string;
};

/**
 * Rattachements plan ↔ démarche (table `demarche_plan_action`), partagés par
 * tous les types de démarches. Une démarche tient plusieurs plans ; un plan
 * n'est en revanche tenu que par une seule démarche « en cours » — règle
 * vérifiée ici par `findActiveDemarchesHoldingPlans` et garantie en dernier
 * ressort par le trigger `demarche_plan_action_exclusif`.
 */
@Injectable()
export class DemarchePlanActionsRepository {
  private readonly logger = new Logger(DemarchePlanActionsRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /** Plans rattachés à chaque démarche, dans l'ordre de rattachement. */
  async listByDemarcheIds(
    demarcheIds: number[],
    tx?: Transaction
  ): Promise<Map<number, number[]>> {
    const planActionIdsByDemarcheId = new Map<number, number[]>();
    if (demarcheIds.length === 0) {
      return planActionIdsByDemarcheId;
    }

    const rows = await (tx ?? this.databaseService.db)
      .select({
        demarcheId: demarchePlanActionTable.demarcheId,
        planActionId: demarchePlanActionTable.planActionId,
      })
      .from(demarchePlanActionTable)
      .where(inArray(demarchePlanActionTable.demarcheId, demarcheIds))
      .orderBy(
        asc(demarchePlanActionTable.createdAt),
        asc(demarchePlanActionTable.planActionId)
      );

    for (const row of rows) {
      const planActionIds = planActionIdsByDemarcheId.get(row.demarcheId) ?? [];
      planActionIds.push(row.planActionId);
      planActionIdsByDemarcheId.set(row.demarcheId, planActionIds);
    }
    return planActionIdsByDemarcheId;
  }

  async listPlanActionIds(
    demarcheId: number,
    tx?: Transaction
  ): Promise<number[]> {
    const byDemarcheId = await this.listByDemarcheIds([demarcheId], tx);
    return byDemarcheId.get(demarcheId) ?? [];
  }

  /**
   * Autres démarches actives tenant déjà l'un de ces plans — tous types de
   * démarches confondus : l'exclusivité porte sur la table partagée `demarche`
   * (les statuts actifs des futurs types s'ajouteront à l'union).
   */
  async findActiveDemarchesHoldingPlans(
    planActionIds: number[],
    excludeDemarcheId: number,
    tx?: Transaction
  ): Promise<DemarcheHoldingPlan[]> {
    if (planActionIds.length === 0) {
      return [];
    }
    return (tx ?? this.databaseService.db)
      .select({
        planActionId: demarchePlanActionTable.planActionId,
        demarcheId: demarcheTable.id,
        titre: demarcheTable.titre,
      })
      .from(demarchePlanActionTable)
      .innerJoin(
        demarcheTable,
        eq(demarcheTable.id, demarchePlanActionTable.demarcheId)
      )
      .where(
        and(
          inArray(demarchePlanActionTable.planActionId, planActionIds),
          ne(demarchePlanActionTable.demarcheId, excludeDemarcheId),
          inArray(demarcheTable.status, [...DEMARCHE_PCAET_ACTIVE_STATUSES])
        )
      );
  }

  /**
   * Remplace l'ensemble des plans rattachés à la démarche. Écriture par
   * différence (et non delete-all + insert comme les pilotes) : les
   * rattachements inchangés gardent leur date et leur auteur, et ne repassent
   * pas par le trigger d'exclusivité.
   */
  async setPlanActions(
    demarcheId: number,
    planActionIds: number[],
    userId: string,
    tx: Transaction
  ): Promise<
    Result<undefined, 'PLAN_DEJA_RATTACHE' | 'SET_PLAN_ACTIONS_ERROR'>
  > {
    try {
      const wanted = [...new Set(planActionIds)];
      const current = await this.listPlanActionIds(demarcheId, tx);

      const removed = current.filter((id) => !wanted.includes(id));
      if (removed.length > 0) {
        await tx
          .delete(demarchePlanActionTable)
          .where(
            and(
              eq(demarchePlanActionTable.demarcheId, demarcheId),
              inArray(demarchePlanActionTable.planActionId, removed)
            )
          );
      }

      const added = wanted.filter((id) => !current.includes(id));
      if (added.length > 0) {
        await tx.insert(demarchePlanActionTable).values(
          added.map((planActionId) => ({
            demarcheId,
            planActionId,
            createdBy: userId,
          }))
        );
      }

      return success(undefined);
    } catch (error) {
      // Course entre deux rattachements simultanés du même plan : le trigger
      // d'exclusivité tranche en dernier ressort.
      if (String(error).includes('demarche_plan_action_exclusif')) {
        return failure('PLAN_DEJA_RATTACHE');
      }
      this.logger.error(
        `Error setting plans for demarche ${demarcheId}: ${error}`
      );
      return failure('SET_PLAN_ACTIONS_ERROR');
    }
  }
}
