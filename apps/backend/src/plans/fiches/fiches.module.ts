import { BullModule } from '@nestjs/bullmq';
import { forwardRef, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import AxeService from '@tet/backend/plans/fiches/axe.service';
import { CreateFicheService } from '@tet/backend/plans/fiches/create-fiche/create-fiche.service';
import { ExportPlanController } from '@tet/backend/plans/fiches/export/export-plan.controller';
import { FicheActionBudgetRouter } from '@tet/backend/plans/fiches/fiche-action-budget/fiche-action-budget.router';
import { FicheActionBudgetService } from '@tet/backend/plans/fiches/fiche-action-budget/fiche-action-budget.service';
import {
  FicheIndexerService,
  SEARCH_INDEXING_FICHE_QUEUE_NAME,
} from '@tet/backend/plans/fiches/fiche-indexer/fiche-indexer.service';
import { FichesRouter } from '@tet/backend/plans/fiches/fiches.router';
import { ListFichesRouter } from '@tet/backend/plans/fiches/list-fiches/list-fiches.router';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import PlanActionsService from '@tet/backend/plans/fiches/plan-actions.service';
import { ShareFicheService } from '@tet/backend/plans/fiches/share-fiches/share-fiche.service';
import { GetActionModule } from '@tet/backend/referentiels/get-action/get-action.module';
import { NotificationsModule } from '@tet/backend/utils/notifications/notifications.module';
import { TransactionModule } from '@tet/backend/utils/transaction/transaction.module';
import { CollectivitesModule } from '../../collectivites/collectivites.module';
import { PlansUtilsModule } from '../utils/plans-utils.module';
import { BulkEditRouter } from './bulk-edit/bulk-edit.router';
import { BulkEditService } from './bulk-edit/bulk-edit.service';
import { CountByRouter } from './count-by/count-by.router';
import { CountByService } from './count-by/count-by.service';
import { CreateFicheRouter } from './create-fiche/create-fiche.router';
import { DeleteFicheRouter } from './delete-fiche/delete-fiche.router';
import { DeleteFicheService } from './delete-fiche/delete-fiche.service';
import { ExportService } from './export/export.service';
import { FicheActionEtapeRouter } from './fiche-action-etape/fiche-action-etape.router';
import { FicheActionEtapeService } from './fiche-action-etape/fiche-action-etape.service';
import FicheActionPermissionsService from './fiche-action-permissions.service';
import { ListFichesBelongingToPlansRepository } from './list-fiches/list-fiches-belonging-to-plans.repository';
import { ListFichesBudgetRepository } from './list-fiches/list-fiches-budget.repository';
import { NotifyPiloteService } from './notify-pilote/notify-pilote.service';
import { FicheActionLinkRepository } from './update-fiche/fiche-action-link.repository';
import { FicheActionLinkService } from './update-fiche/fiche-action-link.service';
import { UpdateFicheRouter } from './update-fiche/update-fiche.router';
import UpdateFicheService from './update-fiche/update-fiche.service';

@Module({
  imports: [
    PlansUtilsModule,
    forwardRef(() => CollectivitesModule),
    NotificationsModule,
    TransactionModule,
    GetActionModule,
    BullModule.registerQueue({
      name: SEARCH_INDEXING_FICHE_QUEUE_NAME,
      defaultJobOptions: FicheIndexerService.DEFAULT_JOB_OPTIONS,
    }),
    // Active le scheduler `@Cron` pour le sweep horaire de récupération des
    // partages dans `FicheIndexerService`. `forRoot()` est idempotent côté
    // NestJS quand appelé dans plusieurs modules — on l'enregistre ici parce
    // qu'aucun autre module backend ne le faisait jusqu'à présent.
    ScheduleModule.forRoot(),
  ],
  providers: [
    PlanActionsService,
    FicheActionPermissionsService,
    ShareFicheService,
    AxeService,
    ListFichesBudgetRepository,
    ListFichesBelongingToPlansRepository,
    ListFichesService,
    ListFichesRouter,
    CountByService,
    CountByRouter,
    BulkEditService,
    BulkEditRouter,
    DeleteFicheService,
    DeleteFicheRouter,
    UpdateFicheService,
    UpdateFicheRouter,
    FicheActionLinkRepository,
    FicheActionLinkService,
    FicheActionEtapeService,
    FicheActionEtapeRouter,
    ExportService,
    FicheActionBudgetService,
    FicheActionBudgetRouter,
    CreateFicheService,
    CreateFicheRouter,
    FichesRouter,
    NotifyPiloteService,
    FicheIndexerService,
  ],
  exports: [
    FicheActionPermissionsService,
    AxeService,
    PlanActionsService,

    FicheActionEtapeService,
    FicheActionEtapeRouter,
    BulkEditRouter,
    FicheActionBudgetService,
    FicheActionBudgetRouter,
    FichesRouter,

    ListFichesService,
    ListFichesRouter,
    ListFichesBudgetRepository,
    CountByService,
    CreateFicheService,
    CreateFicheRouter,

    UpdateFicheService,
    UpdateFicheRouter,
    FicheActionLinkRepository,
    FicheActionLinkService,

    DeleteFicheService,
    DeleteFicheRouter,

    FicheIndexerService,
  ],
  controllers: [ExportPlanController],
})
export class FichesModule {}
