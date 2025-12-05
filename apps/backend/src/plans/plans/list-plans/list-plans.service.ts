import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { MethodResult } from '@/backend/utils/result.type';
import { Injectable, Logger } from '@nestjs/common';
import { ListAxesService } from '../../axes/list-axes/list-axes.service';
import { Plan } from '../get-plan/get-plan.output';
import { GetPlanRepository } from '../get-plan/get-plan.repository';
import { GetPlanService } from '../get-plan/get-plan.service';
import { ListPlansError, ListPlansErrorEnum } from './list-plans.errors';
import { ListPlansInput } from './list-plans.input';
import { ListPlansOutput } from './list-plans.output';
import { ListPlansRepository } from './list-plans.repository';

@Injectable()
export class ListPlansService {
  private readonly logger = new Logger(ListPlansService.name);

  constructor(
    private readonly listPlansRepository: ListPlansRepository,
    private readonly getPlanService: GetPlanService,
    private readonly listAxesService: ListAxesService,
    private readonly getPlanRepository: GetPlanRepository
  ) {}

  async listPlans(
    input: ListPlansInput,
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<MethodResult<ListPlansOutput, ListPlansError>> {
    const isAllowed = await this.getPlanService.checkPermission(
      input.collectiviteId,
      user
    );
    if (!isAllowed) {
      return {
        success: false,
        error: ListPlansErrorEnum.UNAUTHORIZED,
      };
    }

    const listResult = await this.listPlansRepository.listPlans(input, tx);
    if (!listResult.success) {
      return {
        success: false,
        error: listResult.error,
      };
    }
    const { plans: rootAxes, totalCount } = listResult.data;

    const detailedPlans = await Promise.all(
      rootAxes.map(async (rootAxe) => {
        const planId = rootAxe.id;

        // Récupérer les axes récursivement
        const axesResult = await this.listAxesService.listAxesRecursively(
          {
            collectiviteId: rootAxe.collectiviteId,
            parentId: planId,
          },
          user,
          tx
        );

        if (!axesResult.success) {
          this.logger.error(
            `Failed to get axes for plan ${planId}: ${axesResult.error}`
          );
          return null;
        }

        // Récupérer les référents
        const referentsResult = await this.getPlanRepository.getReferents(
          planId,
          tx
        );
        const referents = referentsResult.success ? referentsResult.data : [];

        // Récupérer les pilotes
        const pilotesResult = await this.getPlanRepository.getPilotes(
          planId,
          tx
        );
        const pilotes = pilotesResult.success ? pilotesResult.data : [];

        // Récupérer le type via getPlan qui inclut le type
        const planResult = await this.getPlanRepository.getPlan(planId, tx);
        const type = planResult.success ? planResult.data.type : null;

        return {
          id: planId,
          nom: rootAxe.nom,
          axes: axesResult.data,
          referents,
          pilotes,
          type,
          collectiviteId: rootAxe.collectiviteId,
          createdAt: rootAxe.createdAt,
        } as Plan;
      })
    );

    const validPlans = detailedPlans.filter(
      (plan: Plan | null): plan is Plan => plan !== null
    );

    this.logger.log(
      `Successfully fetched ${validPlans.length} detailed plans for collectivité ${input.collectiviteId} (total: ${totalCount})`
    );

    return {
      success: true,
      data: {
        plans: validPlans,
        totalCount,
      },
    };
  }
}
