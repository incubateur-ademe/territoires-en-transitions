import AxeService from '@/backend/plans/fiches/axe.service';
import { ExportPlanController } from '@/backend/plans/fiches/export/export-plan.controller';
import { FicheActionBudgetRouter } from '@/backend/plans/fiches/fiche-action-budget/fiche-action-budget.router';
import { FicheActionBudgetService } from '@/backend/plans/fiches/fiche-action-budget/fiche-action-budget.service';
import { FicheActionNoteController } from '@/backend/plans/fiches/fiche-action-note/fiche-action-note.controller';
import FicheActionNoteService from '@/backend/plans/fiches/fiche-action-note/fiche-action-note.service';
import FicheActionCreateService from '@/backend/plans/fiches/import/fiche-action-create.service';
import { FicheActionListRouter } from '@/backend/plans/fiches/list-fiches/list-fiches.router';
import FicheActionListService from '@/backend/plans/fiches/list-fiches/list-fiches.service';
import PlanActionsService from '@/backend/plans/fiches/plan-actions.service';
import { forwardRef, Module } from '@nestjs/common';
import { CollectivitesModule } from '../../collectivites/collectivites.module';
import { BulkEditRouter } from './bulk-edit/bulk-edit.router';
import { BulkEditService } from './bulk-edit/bulk-edit.service';
import { CountByRouter } from './count-by/count-by.router';
import { CountByService } from './count-by/count-by.service';
import { ExportService } from './export/export.service';
import { FicheActionEtapeRouter } from './fiche-action-etape/fiche-action-etape.router';
import { FicheActionEtapeService } from './fiche-action-etape/fiche-action-etape.service';
import FicheActionPermissionsService from './fiche-action-permissions.service';
import FichesActionUpdateService from './fiches-action-update.service';
import { FichesActionController } from './fiches-action.controller';

@Module({
  imports: [forwardRef(() => CollectivitesModule)],
  providers: [
    PlanActionsService,
    FicheActionPermissionsService,
    AxeService,
    FicheActionListService,
    FicheActionListRouter,
    CountByService,
    CountByRouter,
    BulkEditService,
    BulkEditRouter,
    FichesActionUpdateService,
    FicheActionEtapeService,
    FicheActionEtapeRouter,
    ExportService,
    FicheActionBudgetService,
    FicheActionBudgetRouter,
    FicheActionNoteService,
    FicheActionCreateService,
  ],
  exports: [
    FicheActionPermissionsService,
    AxeService,
    PlanActionsService,
    FicheActionListService,
    CountByService,
    CountByRouter,
    FicheActionEtapeService,
    FicheActionEtapeRouter,
    BulkEditRouter,
    FicheActionBudgetService,
    FicheActionBudgetRouter,
    FicheActionNoteService,
    FicheActionCreateService,
    FicheActionListRouter,
  ],
  controllers: [
    FichesActionController,
    ExportPlanController,
    FicheActionNoteController,
  ],
})
export class FichesActionModule {}
