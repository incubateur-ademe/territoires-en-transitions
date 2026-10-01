import { Injectable, Logger } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  ServiceSecondArg,
  UnsafeServiceSecondArg,
} from '@tet/backend/utils/nest/service-second-arg.utils';
import { Result } from '@tet/backend/utils/result.type';
import { TransactionOperation } from '@tet/backend/utils/transaction/transaction-manager.service';
import { Plan } from '@tet/domain/plans';
import { ResourceType } from '@tet/domain/users';
import { ListAxesRepository } from '../../axes/list-axes/list-axes.repository';
import FicheActionPermissionsService from '../../fiches/fiche-action-permissions.service';
import { ListFichesBudgetRepository } from '../../fiches/list-fiches/list-fiches-budget.repository';
import { ComputeBudgetRules } from '../compute-budget/compute-budget.rules';
import { GetPlanError, GetPlanErrorEnum } from './get-plan.errors';
import { GetPlanInput } from './get-plan.input';
import { GetPlanOutput, GetPlanRepository } from './get-plan.repository';

@Injectable()
export class GetPlanService {
  private readonly logger = new Logger(GetPlanService.name);

  constructor(
    private readonly collectivite: CollectivitesService,
    private readonly databaseService: DatabaseService,
    private readonly listAxesRepository: ListAxesRepository,
    private readonly listFichesBudgetRepository: ListFichesBudgetRepository,
    private readonly computeBudgetRules: ComputeBudgetRules,
    private readonly getPlanRepository: GetPlanRepository,
    private readonly permissionService: PermissionService,
    private readonly fichePermissionsService: FicheActionPermissionsService
  ) {}

  async getPlan(
    input: GetPlanInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<Plan, GetPlanError>> {
    return this.executeInTransaction(tx, async (transaction) => {
      const planResult = await this.getPlanRepository.getPlan(
        input,
        transaction
      );
      if (!planResult.success) {
        return planResult;
      }
      const plan = planResult.data;

      const isAllowed = await this.checkPermission(plan.collectiviteId, user);
      if (!isAllowed) {
        return {
          success: false,
          error: GetPlanErrorEnum.UNAUTHORIZED,
        };
      }

      const canReadFichesRestreintes =
        await this.fichePermissionsService.hasReadFichePermission(
          { collectiviteId: plan.collectiviteId, restreint: true },
          user,
          true,
          transaction
        );

      return this.buildPlan(
        { plan, includeFichesRestreintes: canReadFichesRestreintes },
        transaction
      );
    });
  }

  async getPlanWithoutPermissionCheck(
    input: GetPlanInput,
    { tx }: UnsafeServiceSecondArg = {}
  ): Promise<Result<Plan, GetPlanError>> {
    return this.executeInTransaction(tx, async (transaction) => {
      const planResult = await this.getPlanRepository.getPlan(
        input,
        transaction
      );
      if (!planResult.success) {
        return planResult;
      }

      return this.buildPlan(
        { plan: planResult.data, includeFichesRestreintes: true },
        transaction
      );
    });
  }

  private async buildPlan(
    {
      plan,
      includeFichesRestreintes,
    }: {
      plan: GetPlanOutput;
      includeFichesRestreintes: boolean;
    },
    tx: Transaction
  ): Promise<Result<Plan, GetPlanError>> {
    const axesResult = await this.listAxesRepository.listChildrenRecursively(
      { collectiviteId: plan.collectiviteId, parentId: plan.id },
      { includeFichesRestreintes },
      tx
    );
    if (!axesResult.success) {
      return axesResult;
    }

    const referentsResult = await this.getPlanRepository.getReferents(
      plan.id,
      tx
    );
    if (!referentsResult.success) {
      return referentsResult;
    }

    const pilotesResult = await this.getPlanRepository.getPilotes(plan.id, tx);
    if (!pilotesResult.success) {
      return pilotesResult;
    }

    const fiches =
      await this.listFichesBudgetRepository.listFicheBudgetsBelongingToPlan(
        { planId: plan.id, includeFichesRestreintes },
        { tx }
      );

    return {
      success: true,
      data: {
        ...plan,
        axes: axesResult.data,
        referents: referentsResult.data,
        pilotes: pilotesResult.data,
        budget: this.computeBudgetRules.computeBudget(fiches),
        totalFiches: fiches.length,
      },
    };
  }

  private executeInTransaction(
    tx: Transaction | undefined,
    operation: TransactionOperation<Plan, GetPlanError>
  ): Promise<Result<Plan, GetPlanError>> {
    return tx ? operation(tx) : this.databaseService.db.transaction(operation);
  }

  async checkPermission(
    collectiviteId: number,
    user: AuthenticatedUser
  ): Promise<boolean> {
    const collectivitePrivate = await this.collectivite.isPrivate(
      collectiviteId
    );

    const permissionResult = await this.permissionService.isAllowed(
      user,
      collectivitePrivate ? 'plans.read_confidentiel' : 'plans.read',
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );

    if (!permissionResult.success) {
      this.logger.log(
        `User ${user.id} is not allowed to get axe for collectivité ${collectiviteId}`
      );
    }

    return permissionResult.success;
  }
}
