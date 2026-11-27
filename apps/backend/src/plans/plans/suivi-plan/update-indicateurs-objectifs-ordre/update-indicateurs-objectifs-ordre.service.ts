import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import { GetPlanError } from '../../get-plan/get-plan.errors';
import { GetPlanService } from '../../get-plan/get-plan.service';
import { planIndicateurOrdreTable } from '../plan-indicateur-ordre.table';
import { UpdateIndicateursObjectifsOrdreInput } from './update-indicateurs-objectifs-ordre.input';

@Injectable()
export class UpdateIndicateursObjectifsOrdreService {
  private readonly logger = new Logger(
    UpdateIndicateursObjectifsOrdreService.name
  );

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly getPlanService: GetPlanService,
    private readonly permissionService: PermissionService
  ) {}

  async updateIndicateursObjectifsOrdre(
    { planId, indicateurIds }: UpdateIndicateursObjectifsOrdreInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<void, GetPlanError>> {
    const planResult = await this.getPlanService.getPlan(
      { planId },
      { user, tx }
    );
    if (!planResult.success) {
      return planResult;
    }
    // la collectivité vient du plan lu, jamais du payload
    const { collectiviteId } = planResult.data;

    const permission = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['PLANS.MUTATE'],
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );
    if (!permission.success) {
      return failure('UNAUTHORIZED');
    }

    // un identifiant répété ne garde que sa première place
    const ordre = [...new Set(indicateurIds)];
    const remplace = async (transaction: Transaction) => {
      await transaction
        .delete(planIndicateurOrdreTable)
        .where(
          and(
            eq(planIndicateurOrdreTable.planId, planId),
            eq(planIndicateurOrdreTable.collectiviteId, collectiviteId)
          )
        );
      if (ordre.length) {
        await transaction.insert(planIndicateurOrdreTable).values(
          ordre.map((indicateurId, index) => ({
            planId,
            collectiviteId,
            indicateurId,
            ordre: index,
          }))
        );
      }
    };

    try {
      if (tx) {
        await remplace(tx);
      } else {
        await this.databaseService.db.transaction(remplace);
      }
      return success(undefined);
    } catch (error) {
      this.logger.error(error);
      return failure(
        'DATABASE_ERROR',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
