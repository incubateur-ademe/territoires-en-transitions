import { Injectable, Logger } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ResourceType } from '@tet/backend/users/authorizations/resource-type.enum';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import { Plan } from '@tet/domain/plans';
import { PermissionOperationEnum } from '@tet/domain/users';
import { ListAxesService } from '../../axes/list-axes/list-axes.service';
import ListFichesService from '../../fiches/list-fiches/list-fiches.service';
import { ComputeBudgetRules } from '../compute-budget/compute-budget.rules';
import { GetPlanError, GetPlanErrorEnum } from './get-plan.errors';
import { GetPlanInput } from './get-plan.input';
import { GetPlanRepository } from './get-plan.repository';

@Injectable()
export class GetPlanService {
  private readonly logger = new Logger(GetPlanService.name);

  constructor(
    private readonly collectivite: CollectivitesService,
    private readonly databaseService: DatabaseService,
    private readonly listAxesService: ListAxesService,
    private readonly listFichesService: ListFichesService,
    private readonly computeBudgetRules: ComputeBudgetRules,
    private readonly getPlanRepository: GetPlanRepository,
    private readonly permissionService: PermissionService
  ) {}

  async getPlan(
    input: GetPlanInput,
    user?: AuthenticatedUser,
    tx?: Transaction
  ): Promise<Result<Plan, GetPlanError>> {
    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<Result<Plan, GetPlanError>> => {
      const { planId } = input;

      const planResult = await this.getPlanRepository.getPlan(
        planId,
        transaction
      );
      if (!planResult.success) {
        return planResult;
      }
      const plan = planResult.data;

      if (user) {
        const isAllowed = await this.checkPermission(plan.collectiviteId, user);
        if (!isAllowed) {
          return {
            success: false,
            error: GetPlanErrorEnum.UNAUTHORIZED,
          };
        }
      }

      const axesResult = await this.listAxesService.listAxesRecursively(
        { collectiviteId: plan.collectiviteId, parentId: plan.id },
        user,
        transaction
      );
      if (!axesResult.success) {
        return axesResult;
      }

      const referentsResult = await this.getPlanRepository.getReferents(
        planId,
        transaction
      );
      if (!referentsResult.success) {
        return referentsResult;
      }

      const pilotesResult = await this.getPlanRepository.getPilotes(
        planId,
        transaction
      );
      if (!pilotesResult.success) {
        return pilotesResult;
      }

      const fiches = await this.listFichesService.listFichesBudgetQuery(
        null,
        { planActionIds: [planId] },
        { limit: 'all' }
      );

      const budget = this.computeBudgetRules.computeBudget(fiches.data);

      return {
        success: true,
        data: {
          ...plan,
          axes: axesResult.data,
          referents: referentsResult.data,
          pilotes: pilotesResult.data,
          budget,
          totalFiches: fiches.data.length,
        },
      };
    };

    return tx
      ? executeInTransaction(tx)
      : this.databaseService.db.transaction(async (newTx) =>
          executeInTransaction(newTx)
        );
  }

  async checkPermission(
    collectiviteId: number,
    user: AuthenticatedUser
  ): Promise<boolean> {
    const collectivitePrivate = await this.collectivite.isPrivate(
      collectiviteId
    );

    const isAllowed = await this.permissionService.isAllowed(
      user,
      collectivitePrivate
        ? PermissionOperationEnum['PLANS.READ']
        : PermissionOperationEnum['PLANS.READ_PUBLIC'],
      ResourceType.COLLECTIVITE,
      collectiviteId,
      true
    );

    if (!isAllowed) {
      this.logger.log(
        `User ${user.id} is not allowed to get axe for collectivité ${collectiviteId}`
      );
    }

    return isAllowed;
  }
}
