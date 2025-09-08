import AxeService from '@/backend/plans/fiches/axe.service';
import { CreateFicheService } from '@/backend/plans/fiches/create-fiche/create-fiche.service';
import { ExportPlanController } from '@/backend/plans/fiches/export/export-plan.controller';
import { FicheActionBudgetRouter } from '@/backend/plans/fiches/fiche-action-budget/fiche-action-budget.router';
import { FicheActionBudgetService } from '@/backend/plans/fiches/fiche-action-budget/fiche-action-budget.service';
import { FicheActionNoteController } from '@/backend/plans/fiches/fiche-action-note/fiche-action-note.controller';
import FicheActionNoteService from '@/backend/plans/fiches/fiche-action-note/fiche-action-note.service';
import { FichesRouter } from '@/backend/plans/fiches/fiches.router';
import { ListFichesRouter } from '@/backend/plans/fiches/list-fiches/list-fiches.router';
import ListFichesService from '@/backend/plans/fiches/list-fiches/list-fiches.service';
import PlanActionsService from '@/backend/plans/fiches/plan-actions.service';
import { ShareFicheService } from '@/backend/plans/fiches/share-fiches/share-fiche.service';
import { forwardRef, Module } from '@nestjs/common';
import { CollectivitesModule } from '../../collectivites/collectivites.module';
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
import { ImportPlanModule } from './import/import-plan.module';
import { UpdateFicheRouter } from './update-fiche/update-fiche.router';
import UpdateFicheService from './update-fiche/update-fiche.service';

@Module({
  imports: [forwardRef(() => CollectivitesModule), ImportPlanModule],
  providers: [
    PlanActionsService,
    FicheActionPermissionsService,
    ShareFicheService,
    AxeService,
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
    FicheActionNoteService,
    CreateFicheService,
    CreateFicheRouter,
    FichesRouter,
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
    FicheActionNoteService,

    FichesRouter,

    ListFichesService,
    ListFichesRouter,

    CreateFicheService,
    CreateFicheRouter,

    UpdateFicheService,
    UpdateFicheRouter,

    DeleteFicheService,
    DeleteFicheRouter,
  ],
  controllers: [ExportPlanController, FicheActionNoteController],
})
export class FichesModule {}
