import AxeService from '@/backend/plans/fiches/axe.service';
import { ExportPlanController } from '@/backend/plans/fiches/export/export-plan.controller';
import FicheActionListService from '@/backend/plans/fiches/fiches-action-list.service';
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
import FicheService from './fiche.service';
import FichesActionUpdateService from './fiches-action-update.service';
import { FichesActionController } from './fiches-action.controller';
import { FicheActionBudgetService } from '@/backend/plans/fiches/fiche-action-budget/fiche-action-budget.service';
import { FicheActionBudgetRouter } from '@/backend/plans/fiches/fiche-action-budget/fiche-action-budget.router';

@Module({
  imports: [forwardRef(() => CollectivitesModule)],
  providers: [
    PlanActionsService,
    FicheService,
    AxeService,
    FicheActionListService,
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
  ],
  exports: [
    FicheService,
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
  ],
  controllers: [FichesActionController, ExportPlanController],
})
export class FichesActionModule {}
