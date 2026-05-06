import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { AddAnnexeRouter } from './add-annexe/add-annexe.router';
import { BulkEditRouter } from './bulk-edit/bulk-edit.router';
import { CountByRouter } from './count-by/count-by.router';
import { CreateFicheRouter } from './create-fiche/create-fiche.router';
import { DeleteFicheRouter } from './delete-fiche/delete-fiche.router';
import { FicheActionBudgetRouter } from './fiche-action-budget/fiche-action-budget.router';
import { FicheActionEtapeRouter } from './fiche-action-etape/fiche-action-etape.router';
import { FicheActionPdfExportRouter } from './fiche-action-pdf-export/fiche-action-pdf-export.router';
import { FicheAnnexesRouter } from './fiche-annexes/fiche-annexes.router';
import { ListFichesRouter } from './list-fiches/list-fiches.router';
import { UpdateFicheRouter } from './update-fiche/update-fiche.router';

@Injectable()
export class FichesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listFichesRouter: ListFichesRouter,
    private readonly ficheAnnexesRouter: FicheAnnexesRouter,
    private readonly updateFicheRouter: UpdateFicheRouter,
    private readonly createFicheRouter: CreateFicheRouter,
    private readonly addAnnexeRouter: AddAnnexeRouter,
    private readonly deleteFicheRouter: DeleteFicheRouter,
    private readonly countByRouter: CountByRouter,
    private readonly bulkEditRouter: BulkEditRouter,
    private readonly ficheActionEtapeRouter: FicheActionEtapeRouter,
    private readonly ficheActionBudgetRouter: FicheActionBudgetRouter,
    private readonly ficheActionPdfExportRouter: FicheActionPdfExportRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.listFichesRouter.router,
    this.ficheAnnexesRouter.router,
    this.createFicheRouter.router,
    this.addAnnexeRouter.router,
    this.updateFicheRouter.router,
    this.deleteFicheRouter.router,

    this.countByRouter.router,
    this.bulkEditRouter.router,
    this.ficheActionEtapeRouter.router,
    this.ficheActionBudgetRouter.router,
    this.ficheActionPdfExportRouter.router
  );

  createCaller = this.trpc.createCallerFactory(this.router);
}
