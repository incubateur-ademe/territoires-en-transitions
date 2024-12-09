import { CollectiviteMembresRouter } from '@/backend/collectivites/membres/membres.router';
import { PersonnesRouter } from '@/backend/collectivites/personnes.router';
import { GetCategoriesByCollectiviteRouter } from '@/backend/collectivites/shared/routers/get-categories-by-collectivite.router';
import { IndicateurFiltreRouter } from '@/backend/indicateurs/indicateur-filtre/indicateur-filtre.router';
import { TrajectoiresRouter } from '@/backend/indicateurs/trajectoires/trajectoires.router';
import { BulkEditRouter } from '@/backend/plans/fiches/bulk-edit/bulk-edit.router';
import { CountByStatutRouter } from '@/backend/plans/fiches/count-by-statut/count-by-statut.router';
import { FicheActionEtapeRouter } from '@/backend/plans/fiches/fiche-action-etape/fiche-action-etape.router';
import { INestApplication, Injectable, Logger } from '@nestjs/common';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { SupabaseService } from '../common/services/supabase.service';
import { createContext, TrpcService } from './trpc.service';

@Injectable()
export class TrpcRouter {
  private readonly logger = new Logger(TrpcRouter.name);

  constructor(
    private readonly trpc: TrpcService,
    private readonly supabase: SupabaseService,
    private readonly trajectoiresRouter: TrajectoiresRouter,
    private readonly countByStatutRouter: CountByStatutRouter,
    private readonly getCategoriesByCollectiviteRouter: GetCategoriesByCollectiviteRouter,
    private readonly personnes: PersonnesRouter,
    private readonly ficheActionEtapeRouter: FicheActionEtapeRouter,
    private readonly indicateurFiltreRouter: IndicateurFiltreRouter,
    private readonly bulkEditRouter: BulkEditRouter,
    private readonly membresRouter: CollectiviteMembresRouter
  ) {}

  appRouter = this.trpc.router({
    indicateurs: {
      trajectoires: this.trajectoiresRouter.router,
      filtre: this.indicateurFiltreRouter.router,
    },
    plans: {
      fiches: this.trpc.mergeRouters(
        this.countByStatutRouter.router,
        this.bulkEditRouter.router,
        this.ficheActionEtapeRouter.router
      ),
    },
    collectivites: {
      personnes: this.personnes.router,
      membres: this.membresRouter.router,
    },
    tags: {
      categories: this.getCategoriesByCollectiviteRouter.router,
    },
  });

  createCaller = this.trpc.createCallerFactory(this.appRouter);

  async applyMiddleware(app: INestApplication) {
    this.logger.log(`Applying trpc middleware`);
    app.use(
      `/trpc`,
      createExpressMiddleware({
        router: this.appRouter,
        createContext: (opts) => createContext(this.supabase.client, opts),
      })
    );
  }
}

export type AppRouter = TrpcRouter[`appRouter`];
