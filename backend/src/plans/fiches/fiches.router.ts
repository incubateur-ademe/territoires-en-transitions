import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { BulkEditRouter } from './bulk-edit/bulk-edit.router';
import { CountByRouter } from './count-by/count-by.router';
import { FicheActionBudgetRouter } from './fiche-action-budget/fiche-action-budget.router';
import { FicheActionEtapeRouter } from './fiche-action-etape/fiche-action-etape.router';
import { ImportPlanRouter } from './import/import-plan.router';
import { ListFichesRouter } from './list-fiches/list-fiches.router';
import { UpdateFicheRouter } from './update-fiche/update-fiche.router';

@Injectable()
export class FichesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listFichesRouter: ListFichesRouter,
    private readonly updateFicheRouter: UpdateFicheRouter,
    private readonly countByRouter: CountByRouter,
    private readonly bulkEditRouter: BulkEditRouter,
    private readonly ficheActionEtapeRouter: FicheActionEtapeRouter,
    private readonly importRouter: ImportPlanRouter,
    private readonly ficheActionBudgetRouter: FicheActionBudgetRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.listFichesRouter.router,
    this.updateFicheRouter.router,
    this.countByRouter.router,
    this.bulkEditRouter.router,
    this.ficheActionEtapeRouter.router,
    this.importRouter.router,
    this.ficheActionBudgetRouter.router
  );

  createCaller = this.trpc.createCallerFactory(this.router);
}
