import { Injectable } from '@nestjs/common';
import { tableauDeBordModuleTable } from '@tet/backend/metrics/module.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  ModuleFicheCountFilters,
  SuiviPlanModule,
  UpsertSuiviPlanModuleInput,
} from '@tet/domain/metrics';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { and, eq, isNull } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { GetPlanService } from '../../get-plan/get-plan.service';
import {
  SuiviPlanModulesError,
  SuiviPlanModulesErrorEnum,
} from './suivi-plan-modules.errors';

type ModuleRow = typeof tableauDeBordModuleTable.$inferSelect;

@Injectable()
export class SuiviPlanModulesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly getPlanService: GetPlanService,
    private readonly permissionService: PermissionService
  ) {}

  async listModules(
    { planId }: { planId: number },
    { user, tx }: ServiceSecondArg
  ): Promise<Result<SuiviPlanModule[], SuiviPlanModulesError>> {
    const accessResult = await this.getPlanAccess(planId, 'read', user, tx);
    if (!accessResult.success) {
      return accessResult;
    }
    const { collectiviteId } = accessResult.data;

    const rows = await (tx ?? this.databaseService.db)
      .select()
      .from(tableauDeBordModuleTable)
      .where(this.isModuleOfPlan(planId, collectiviteId))
      .orderBy(tableauDeBordModuleTable.createdAt);

    return success(rows.map((row) => this.toModule(row, planId)));
  }

  async upsertModule(
    input: UpsertSuiviPlanModuleInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<SuiviPlanModule, SuiviPlanModulesError>> {
    const accessResult = await this.getPlanAccess(
      input.planId,
      'mutate',
      user,
      tx
    );
    if (!accessResult.success) {
      return accessResult;
    }
    const { collectiviteId } = accessResult.data;
    const db = tx ?? this.databaseService.db;

    const titre = input.titre;
    const options = {
      countByProperty: input.options.countByProperty,
      filtre: this.forcePlanFilter(input.options.filtre, input.planId),
    };

    const [row] = await db
      .insert(tableauDeBordModuleTable)
      .values({
        id: input.id ?? crypto.randomUUID(),
        collectiviteId,
        planId: input.planId,
        userId: null,
        defaultKey: null,
        type: 'fiche-action.count-by',
        titre,
        options,
      })
      .onConflictDoUpdate({
        target: tableauDeBordModuleTable.id,
        set: { titre, options },
        setWhere: this.isModuleOfPlan(input.planId, collectiviteId),
      })
      .returning();

    if (!row) {
      return failure(SuiviPlanModulesErrorEnum.MODULE_NOT_FOUND);
    }
    return success(this.toModule(row, input.planId));
  }

  async deleteModule(
    { planId, moduleId }: { planId: number; moduleId: string },
    { user, tx }: ServiceSecondArg
  ): Promise<Result<void, SuiviPlanModulesError>> {
    const accessResult = await this.getPlanAccess(planId, 'mutate', user, tx);
    if (!accessResult.success) {
      return accessResult;
    }
    const { collectiviteId } = accessResult.data;

    const deleted = await (tx ?? this.databaseService.db)
      .delete(tableauDeBordModuleTable)
      .where(
        and(
          eq(tableauDeBordModuleTable.id, moduleId),
          this.isModuleOfPlan(planId, collectiviteId)
        )
      )
      .returning({ id: tableauDeBordModuleTable.id });

    if (deleted.length === 0) {
      return failure(SuiviPlanModulesErrorEnum.MODULE_NOT_FOUND);
    }
    return success(undefined);
  }

  private async getPlanAccess(
    planId: number,
    operation: 'read' | 'mutate',
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<Result<{ collectiviteId: number }, SuiviPlanModulesError>> {
    const [plan] = await (tx ?? this.databaseService.db)
      .select({ collectiviteId: axeTable.collectiviteId })
      .from(axeTable)
      .where(and(eq(axeTable.id, planId), isNull(axeTable.parent)));

    if (!plan) {
      return failure(SuiviPlanModulesErrorEnum.PLAN_NOT_FOUND);
    }

    const isAllowed =
      operation === 'read'
        ? await this.getPlanService.checkPermission(
            plan.collectiviteId,
            user,
            tx
          )
        : (
            await this.permissionService.isAllowed(
              user,
              PermissionOperationEnum['PLANS.MUTATE'],
              ResourceType.COLLECTIVITE,
              { collectiviteId: plan.collectiviteId },
              tx
            )
          ).success;

    if (!isAllowed) {
      return failure(SuiviPlanModulesErrorEnum.UNAUTHORIZED);
    }
    return success({ collectiviteId: plan.collectiviteId });
  }

  private isModuleOfPlan(planId: number, collectiviteId: number) {
    return and(
      eq(tableauDeBordModuleTable.planId, planId),
      eq(tableauDeBordModuleTable.collectiviteId, collectiviteId),
      isNull(tableauDeBordModuleTable.userId)
    );
  }

  private forcePlanFilter(
    filtre: ModuleFicheCountFilters,
    planId: number
  ): ModuleFicheCountFilters {
    return { ...filtre, planActionIds: [planId], noPlan: undefined };
  }

  private toModule(row: ModuleRow, planId: number): SuiviPlanModule {
    const options = row.options as SuiviPlanModule['options'];
    return {
      id: row.id,
      collectiviteId: row.collectiviteId,
      planId,
      userId: null,
      titre: row.titre ?? '',
      defaultKey: null,
      type: 'fiche-action.count-by',
      options: {
        countByProperty: options.countByProperty,
        filtre: this.forcePlanFilter(options.filtre, planId),
      },
      createdAt: this.toIsoDate(row.createdAt),
      modifiedAt: this.toIsoDate(row.modifiedAt),
    };
  }

  private toIsoDate(date: string) {
    return DateTime.fromSQL(date).toUTC().toISO() ?? date;
  }
}
