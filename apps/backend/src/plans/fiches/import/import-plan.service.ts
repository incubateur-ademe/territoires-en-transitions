import { CollectiviteMembresService } from '@/backend/collectivites/membres/membres.service';
import { TagService } from '@/backend/collectivites/tags/tag.service';
import FicheActionCreateService from '@/backend/plans/fiches/import/fiche-action-create.service';
import { ImportPlanSaveService } from '@/backend/plans/fiches/import/import-plan-save.service';
import {
  failure,
  Result,
  success,
} from '@/backend/plans/fiches/import/types/result';
import { parsePlanExcel } from '@/backend/plans/fiches/import/utils/excel-parser';
import { savePlan } from '@/backend/plans/fiches/import/utils/plan-save';
import { transformToPlan } from '@/backend/plans/fiches/import/utils/plan-transformer';
import { validatePlan } from '@/backend/plans/fiches/import/utils/plan-validator';
import {
  UpdatePlanPilotesSchema,
  UpdatePlanReferentsSchema,
} from '@/backend/plans/plans/plans.schema';
import { PlanService } from '@/backend/plans/plans/plans.service';
import { EffetAttenduService } from '@/backend/shared/effet-attendu/effet-attendu.service';
import { ThematiqueService } from '@/backend/shared/thematiques/thematique.service';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { TransactionManager } from '@/backend/utils/transaction/transaction-manager.service';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ImportPlanService {
  private readonly logger = new Logger(ImportPlanService.name);
  constructor(
    private readonly save: ImportPlanSaveService,
    private readonly memberService: CollectiviteMembresService,
    private readonly effetAttenduService: EffetAttenduService,
    private readonly thematiqueService: ThematiqueService,
    private readonly planService: PlanService,
    private readonly tagService: TagService,
    private readonly transactionManager: TransactionManager,
    private readonly ficheService: FicheActionCreateService
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

    // Transform data into plan structure
    const planResult = await transformToPlan(
      parseResult.data.rows,
      planName,
      planType,
      pilotes,
      referents
    );
    if (!planResult.success) {
      return failure(planResult.error);
    }

    // Validate plan data
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

    // Save all data
    const saveResult = await this.transactionManager.executeSingle(
      async (tx) => {
        // No need to save tags first anymore as they're handled by the fiche service

        // Save plan and all its data
        const planSaveResult = await savePlan(
          {
            plan: planResult.data,
            collectiviteId,
            user,
            tx,
          },
          this.planService,
          this.ficheService
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
