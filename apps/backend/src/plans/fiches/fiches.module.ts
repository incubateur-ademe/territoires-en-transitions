import { forwardRef, Module } from '@nestjs/common';
import AxeService from '@tet/backend/plans/fiches/axe.service';
import { CreateFicheService } from '@tet/backend/plans/fiches/create-fiche/create-fiche.service';
import { ExportPlanController } from '@tet/backend/plans/fiches/export/export-plan.controller';
import { FicheActionBudgetRouter } from '@tet/backend/plans/fiches/fiche-action-budget/fiche-action-budget.router';
import { FicheActionBudgetService } from '@tet/backend/plans/fiches/fiche-action-budget/fiche-action-budget.service';
import { FichesRouter } from '@tet/backend/plans/fiches/fiches.router';
import { ListFichesRouter } from '@tet/backend/plans/fiches/list-fiches/list-fiches.router';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import PlanActionsService from '@tet/backend/plans/fiches/plan-actions.service';
import { ShareFicheService } from '@tet/backend/plans/fiches/share-fiches/share-fiche.service';
import { NotificationsModule } from '@tet/backend/utils/notifications/notifications.module';
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
import { UpdateFicheRouter } from './update-fiche/update-fiche.router';
import UpdateFicheService from './update-fiche/update-fiche.service';

@Module({
  imports: [
    PlansUtilsModule,
    forwardRef(() => CollectivitesModule),
    NotificationsModule,
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
    FicheActionEtapeService,
    FicheActionEtapeRouter,
    ExportService,
    FicheActionBudgetService,
    FicheActionBudgetRouter,
    CreateFicheService,
    CreateFicheRouter,
    FichesRouter,
    NotifyPiloteService,
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

    DeleteFicheService,
    DeleteFicheRouter,
  ],
  controllers: [ExportPlanController],
})
export class FichesModule {}
