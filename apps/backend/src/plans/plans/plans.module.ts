import { GetPlanReferencesService } from './get-plan-references/get-plan-references.service';
import { IndicateursModule } from '@tet/backend/indicateurs/indicateurs.module';
import { ManagePlanIndicateurSourceService } from './manage-plan-indicateur-source/manage-plan-indicateur-source.service';
import { electrificationLaureatsConfig } from '@tet/domain/plans';
import { CheckElectrificationEligibilityService } from './electrification/check-electrification-eligibility/check-electrification-eligibility.service';
import { CheckElectrificationCreationService } from './electrification/check-electrification-creation.service';
import { CheckPlanCreationService } from './check-plan-creation/check-plan-creation.service';
import { CheckPlanCreationRouter } from './check-plan-creation/check-plan-creation.router';
import { ELECTRIFICATION_LAUREATS_CONFIG } from './electrification/config/electrification-eligibility.constants';
import { forwardRef, Module } from '@nestjs/common';
import { CollectivitesModule } from '@tet/backend/collectivites/collectivites.module';
import { TrackingModule } from '@tet/backend/utils/tracking/tracking.module';
import { TransactionModule } from '@tet/backend/utils/transaction/transaction.module';
import { AxeModule } from '../axes/axe.module';
import { DeleteAxeRepository } from '../axes/delete-axe/delete-axe.repository';
import { DeleteAxeRouter } from '../axes/delete-axe/delete-axe.router';
import { DeleteAxeService } from '../axes/delete-axe/delete-axe.service';
import { GetAxeRepository } from '../axes/get-axe/get-axe.repository';
import { GetAxeRouter } from '../axes/get-axe/get-axe.router';
import { GetAxeService } from '../axes/get-axe/get-axe.service';
import { ListAxesRepository } from '../axes/list-axes/list-axes.repository';
import { ListAxesRouter } from '../axes/list-axes/list-axes.router';
import { ListAxesService } from '../axes/list-axes/list-axes.service';
import { UpsertAxeRepository } from '../axes/upsert-axe/upsert-axe.repository';
import { UpsertAxeRouter } from '../axes/upsert-axe/upsert-axe.router';
import { UpsertAxeService } from '../axes/upsert-axe/upsert-axe.service';
import { FichesModule } from '../fiches/fiches.module';
import { ComputeBudgetRules } from './compute-budget/compute-budget.rules';
import { DeletePlanRepository } from './delete-plan/delete-plan.repository';
import { DeletePlanRouter } from './delete-plan/delete-plan.router';
import { DeletePlanService } from './delete-plan/delete-plan.service';
import { DuplicatePlanRouter } from './duplicate-plan/duplicate-plan.router';
import { DuplicatePlanService } from './duplicate-plan/duplicate-plan.service';
import { GetPlanCompletionRouter } from './get-plan-completion/get-plan-completion.router';
import { GetPlanCompletionService } from './get-plan-completion/get-plan-completion.service';
import { GetPlanRepository } from './get-plan/get-plan.repository';
import { GetPlanRouter } from './get-plan/get-plan.router';
import { GetPlanService } from './get-plan/get-plan.service';
import { CreatePlanAggregateService } from './create-plan-aggregate/create-plan-aggregate.service';
import { ImportExcelPlanApplicationService } from './import-plan-aggregate/import-excel-plan.application-service';
import { ImportPlanRouter } from './import-plan-aggregate/import-plan.router';
import { ImportPlanService } from './import-plan-aggregate/import-plan.service';
import { ResolveEntityService } from './import-plan-aggregate/resolvers/resolve-entity.service';
import { PersistPlanIndicateursService } from './persist-plan-indicateurs/persist-plan-indicateurs.service';
import { ListPlanTypesRouter } from './list-plan-types/list-plan-types.router';
import { ListPlanTypesService } from './list-plan-types/list-plan-types.service';
import { ListPlansRepository } from './list-plans/list-plans.repository';
import { ListPlansRouter } from './list-plans/list-plans.router';
import { ListPlansService } from './list-plans/list-plans.service';
import { PlanRouter } from './plans.router';
import { PlanProgressRules } from './progress/plan-progress.rules';
import { UpsertPlanRepository } from './upsert-plan/upsert-plan.repository';
import { UpsertPlanRouter } from './upsert-plan/upsert-plan.router';
import { UpsertPlanService } from './upsert-plan/upsert-plan.service';
import { PlanVerificationRepository } from './verify-plan/plan-verification.repository';
import { VerifyPlanRouter } from './verify-plan/verify-plan.router';
import { VerifyPlanService } from './verify-plan/verify-plan.service';

@Module({
  imports: [
    forwardRef(() => CollectivitesModule),
    forwardRef(() => FichesModule),
    forwardRef(() => IndicateursModule),
    AxeModule,
    TrackingModule,
    TransactionModule,
  ],
  providers: [
    {
      provide: ELECTRIFICATION_LAUREATS_CONFIG,
      useValue: electrificationLaureatsConfig,
    },
    CheckElectrificationEligibilityService,
    CheckElectrificationCreationService,
    CheckPlanCreationService,
    CheckPlanCreationRouter,
    GetPlanCompletionService,
    GetPlanCompletionRouter,
    DeleteAxeService,
    DeleteAxeRouter,
    DeleteAxeRepository,
    GetAxeService,
    GetAxeRouter,
    GetAxeRepository,
    ListAxesRepository,
    ListAxesService,
    ListAxesRouter,
    UpsertAxeService,
    UpsertAxeRouter,
    UpsertAxeRepository,
    DeletePlanRepository,
    DeletePlanService,
    DeletePlanRouter,
    DuplicatePlanService,
    DuplicatePlanRouter,
    GetPlanRepository,
    GetPlanService,
    GetPlanRouter,
    ListPlansRepository,
    ListPlansService,
    ListPlansRouter,
    ListPlanTypesService,
    ListPlanTypesRouter,
    UpsertPlanRepository,
    UpsertPlanService,
    UpsertPlanRouter,
    PlanProgressRules,
    ComputeBudgetRules,
    PlanRouter,
    CreatePlanAggregateService,
    GetPlanReferencesService,
    ManagePlanIndicateurSourceService,
    PersistPlanIndicateursService,
    ImportPlanService,
    ImportExcelPlanApplicationService,
    ImportPlanRouter,
    ResolveEntityService,
    PlanVerificationRepository,
    VerifyPlanService,
    VerifyPlanRouter,
  ],
  exports: [
    CreatePlanAggregateService,
    ResolveEntityService,
    GetPlanReferencesService,
    ManagePlanIndicateurSourceService,
    PersistPlanIndicateursService,
    CheckElectrificationEligibilityService,
    CheckElectrificationCreationService,
    PlanRouter,
    UpsertPlanService,
    UpsertAxeService,
    ListPlansService,
    GetPlanService,
    PlanProgressRules,
    ComputeBudgetRules,
    ImportPlanService,
    ListPlanTypesService,
    PlanVerificationRepository,
  ],
})
export class PlanModule {}
