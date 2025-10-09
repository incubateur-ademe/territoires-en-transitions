import { CollectiviteMembresService } from '@/backend/collectivites/membres/membres.service';
import { TagService } from '@/backend/collectivites/tags/tag.service';
import { PlanAggregateService } from '@/backend/plans/fiches/import/services/plan-aggregate.service';
import {
  failure,
  Result,
  success,
} from '@/backend/plans/fiches/import/types/result';
import { parsePlanExcel } from '@/backend/plans/fiches/import/utils/excel-parser';
import { validatePlan } from '@/backend/plans/fiches/import/utils/plan-aggregator.validator';
import { transformToPlan } from '@/backend/plans/fiches/import/utils/plan-transformer';
import {
  UpdatePlanPilotesSchema,
  UpdatePlanReferentsSchema,
} from '@/backend/plans/plans/plans.schema';
import { EffetAttenduService } from '@/backend/shared/effet-attendu/effet-attendu.service';
import { ThematiqueService } from '@/backend/shared/thematiques/thematique.service';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { TransactionManager } from '@/backend/utils/transaction/transaction-manager.service';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ImportPlanService {
  private readonly logger = new Logger(ImportPlanService.name);
  constructor(
    private readonly memberService: CollectiviteMembresService,
    private readonly effetAttenduService: EffetAttenduService,
    private readonly thematiqueService: ThematiqueService,
    private readonly tagService: TagService,
    private readonly transactionManager: TransactionManager,
    private readonly planAggregate: PlanAggregateService
  ) {}

  async import(
    user: AuthenticatedUser,
    file: string,
    collectiviteId: number,
    planName: string,
    planType?: number,
    pilotes?: UpdatePlanPilotesSchema[],
    referents?: UpdatePlanReferentsSchema[]
  ): Promise<Result<boolean, string>> {
    this.logger.log(
      `Début de l'import ${planName} avec le type ${planType} pour la collectivité ${collectiviteId}`
    );

    const parseResult = await parsePlanExcel(file);
    if (!parseResult.success) {
      return failure(
        `Erreur lors de la lecture du fichier Excel : ${parseResult.error.message}`
      );
    }

    const planResult = await transformToPlan(
      parseResult.data,
      planName,
      planType,
      pilotes,
      referents
    );
    if (!planResult.success) {
      return failure(planResult.error);
    }

    const validationResult = await validatePlan({
      plan: planResult.data,
      collectiviteId: collectiviteId,
      memberService: this.memberService,
      thematiqueService: this.thematiqueService,
      effetAttenduService: this.effetAttenduService,
      tagService: this.tagService,
    });
    if (!validationResult.success) {
      return failure(
        `Erreur de validation : ${validationResult.error.message}`
      );
    }

    // Create plan with all its data
    const saveResult = await this.transactionManager.executeSingle(
      async (tx) => {
        const planSaveResult = await this.planAggregate.createPlan(
          planResult.data,
          collectiviteId,
          user,
          tx
        );

        if (!planSaveResult.success) {
          return failure(planSaveResult.error);
        }

        return success(true);
      }
    );

    if (!saveResult.success) {
      this.logger.error('Error saving import data:', saveResult.error);
      return failure(
        `Une erreur est survenue lors de la sauvegarde. Merci de contacter un développeur avec l'erreur suivante : ${saveResult.error}`
      );
    }

    this.logger.log(`Fin de l'import`);
    return success(true);
  }

  /**
   * Check that the Excel columns match the expected pattern
   * @param worksheet
   * @param row
   * @private
   */
}
