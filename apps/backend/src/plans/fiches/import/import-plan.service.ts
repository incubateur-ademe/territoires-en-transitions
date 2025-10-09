import { CollectiviteMembresService } from '@/backend/collectivites/membres/membres.service';
import { TagService } from '@/backend/collectivites/tags/tag.service';
import { TagEnum } from '@/backend/collectivites/tags/tag.table-base';
import { ResolvedEntities } from '@/backend/plans/fiches/import/import-plan.dto';
import { PlanAggregateService } from '@/backend/plans/fiches/import/services/plan-aggregate.service';
import {
  failure,
  Result,
  success,
} from '@/backend/plans/fiches/import/types/result';
import {
  EffetAttenduResolver,
  MemberResolver,
  TagResolver,
  ThematiqueResolver,
} from '@/backend/plans/fiches/import/utils/entity-resolver';
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

    const validationResult = await validatePlan(planResult.data);
    if (!validationResult.success) {
      return failure(
        `Erreur de validation : ${validationResult.error.message}`
      );
    }

    // Create plan with all its data
    const saveResult = await this.transactionManager.executeSingle(
      async (tx) => {
        try {
          // Initialize resolvers
          const memberResolver = new MemberResolver(
            this.memberService,
            collectiviteId
          );
          const structureResolver = new TagResolver(
            this.tagService,
            TagEnum.Structure,
            collectiviteId
          );
          const serviceResolver = new TagResolver(
            this.tagService,
            TagEnum.Service,
            collectiviteId
          );
          const financeurResolver = new TagResolver(
            this.tagService,
            TagEnum.Financeur,
            collectiviteId
          );
          const thematiqueResolver = new ThematiqueResolver(
            this.thematiqueService,
            false
          );
          const sousThematiqueResolver = new ThematiqueResolver(
            this.thematiqueService,
            true
          );
          const effetAttenduResolver = new EffetAttenduResolver(
            this.effetAttenduService
          );

          // Resolve all entities
          const resolvedEntities: ResolvedEntities = {
            // Members
            pilotes: await Promise.all(
              planResult.data.fiches.flatMap((f) =>
                (f.pilotes || []).map((p) =>
                  memberResolver.resolveOrCreate(p, tx)
                )
              )
            ),
            referents: await Promise.all(
              planResult.data.fiches.flatMap((f) =>
                (f.referents || []).map((r) =>
                  memberResolver.resolveOrCreate(r, tx)
                )
              )
            ),

            // Tags
            structures: await Promise.all(
              planResult.data.fiches.flatMap((f) =>
                (f.structures || []).map((s) =>
                  structureResolver.resolveOrCreate(s, tx)
                )
              )
            ),
            services: await Promise.all(
              planResult.data.fiches.flatMap((f) =>
                (f.services || []).map((s) =>
                  serviceResolver.resolveOrCreate(s, tx)
                )
              )
            ),
            financeurs: await Promise.all(
              planResult.data.fiches.flatMap((f) =>
                (f.financeurs || []).map((fin) =>
                  financeurResolver.resolveOrCreate(fin.nom, tx)
                )
              )
            ),

            // Thematiques
            thematiques: await Promise.all(
              planResult.data.fiches.flatMap((f) =>
                (f.thematiques || []).map((t) =>
                  thematiqueResolver.resolveOrCreate(t, tx)
                )
              )
            ),
            sousThematiques: await Promise.all(
              planResult.data.fiches.flatMap((f) =>
                (f.sousThematiques || []).map((st) =>
                  sousThematiqueResolver.resolveOrCreate(st, tx)
                )
              )
            ),

            // Effets Attendus
            effetsAttendus: await Promise.all(
              planResult.data.fiches.flatMap((f) =>
                (f.effetsAttendus || []).map((ea) =>
                  effetAttenduResolver.resolveOrCreate(ea, tx)
                )
              )
            ),
          };

          // Create plan with resolved entities
          const planSaveResult = await this.planAggregate.createPlan(
            {
              ...planResult.data,
              resolvedEntities,
            },
            collectiviteId,
            user,
            tx
          );

          if (!planSaveResult.success) {
            tx.rollback();
            return failure(planSaveResult.error);
          }

          return success(true);
        } catch (error) {
          tx.rollback();
          this.logger.error('Error resolving entities:', error);
          return failure(
            `Une erreur est survenue lors de la résolution des entités : ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
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
