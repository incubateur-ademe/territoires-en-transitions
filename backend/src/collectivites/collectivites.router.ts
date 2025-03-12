import { Injectable } from '@nestjs/common';
import { TrpcService } from '../utils/trpc/trpc.service';
import { ListCategoriesRouter } from './handle-categories/list-categories.router';
import { ListCollectivitesRouter } from './list-collectivites/list-collectivites.router';
import { CollectiviteMembresRouter } from './membres/membres.router';
import { PersonnesRouter } from './personnes.router';
import { TableauDeBordCollectiviteRouter } from './tableau-de-bord/tableau-de-bord-collectivite.router';
import { CollectiviteCrudRouter } from '@/backend/collectivites/collectivite-crud/collectivite-crud.router';

@Injectable()
export class CollectivitesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly personnesRouter: PersonnesRouter,
    private readonly membresRouter: CollectiviteMembresRouter,
    private readonly tableauBordRouter: TableauDeBordCollectiviteRouter,
    private readonly categoriesRouter: ListCategoriesRouter,
    private readonly listCollectivitesRouter: ListCollectivitesRouter,
    private readonly upsertRouter : CollectiviteCrudRouter
  ) {}

  router = this.trpc.router({
    personnes: this.personnesRouter.router,
    membres: this.membresRouter.router,
    tableauDeBord: this.tableauBordRouter.router,
    categories: this.categoriesRouter.router,
    collectivites: this.trpc.mergeRouters(
      this.listCollectivitesRouter.router,
      this.upsertRouter.router
    )
  });
}
