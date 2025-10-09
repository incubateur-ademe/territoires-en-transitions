import AxeService from '@/backend/plans/fiches/axe.service';
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
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
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
import { ImportPlanModule } from './import/import-plan.module';
import { ImportPlanRouter } from './import/import-plan.router';
import { FicheService } from './services/fiche.service';
import { UpdateFicheRouter } from './update-fiche/update-fiche.router';
import UpdateFicheService from './update-fiche/update-fiche.service';

@Module({
  imports: [
    forwardRef(() => CollectivitesModule),
    forwardRef(() => ImportPlanModule),
  ],
  providers: [
    FicheService,
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
    UpdateFicheService,
    UpdateFicheRouter,
    FicheActionEtapeService,
    FicheActionEtapeRouter,
    ExportService,
    FicheActionBudgetService,
    FicheActionBudgetRouter,
    FicheActionNoteService,
    {
      provide: FichesRouter,
      useFactory: (
        trpc: TrpcService,
        listFichesRouter: ListFichesRouter,
        updateFicheRouter: UpdateFicheRouter,
        countByRouter: CountByRouter,
        bulkEditRouter: BulkEditRouter,
        ficheActionEtapeRouter: FicheActionEtapeRouter,
        importRouter: ImportPlanRouter,
        ficheActionBudgetRouter: FicheActionBudgetRouter
      ) =>
        new FichesRouter(
          trpc,
          listFichesRouter,
          updateFicheRouter,
          countByRouter,
          bulkEditRouter,
          ficheActionEtapeRouter,
          importRouter,
          ficheActionBudgetRouter
        ),
      inject: [
        TrpcService,
        ListFichesRouter,
        UpdateFicheRouter,
        CountByRouter,
        BulkEditRouter,
        FicheActionEtapeRouter,
        { token: ImportPlanRouter, optional: false },
        FicheActionBudgetRouter,
      ],
    },
  ],
  exports: [
    FicheService,
    FicheActionPermissionsService,
    AxeService,
    PlanActionsService,
    ListFichesService,
    FicheActionEtapeService,
    FicheActionEtapeRouter,
    BulkEditRouter,
    FicheActionBudgetService,
    FicheActionBudgetRouter,
    FicheActionNoteService,
    ListFichesRouter,
    FichesRouter,
    UpdateFicheService,
  ],
  controllers: [ExportPlanController, FicheActionNoteController],
})
export class FichesModule {}
