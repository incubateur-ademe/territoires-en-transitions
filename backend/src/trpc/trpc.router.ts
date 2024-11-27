import { INestApplication, Injectable, Logger } from '@nestjs/common';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { PersonnesRouter } from '../collectivites/personnes.router';
import SupabaseService from '../common/services/supabase.service';
import { CountByStatutRouter } from '../fiches/count-by-statut/count-by-statut.router';
import { TrajectoiresRouter } from '../indicateurs/routers/trajectoires.router';
import { createContext, TrpcService } from './trpc.service';
import {
  GetCategoriesByCollectiviteRouter
} from '../taxonomie/routers/get-categories-by-collectivite.router';
import { FicheActionEtapeRouter } from '../fiches/fiche-action-etape/fiche-action-etape.router';

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
    private readonly ficheActionEtapeRouter : FicheActionEtapeRouter,
  ) {}

  appRouter = this.trpc.router({
    indicateurs: {
      trajectoires: this.trajectoiresRouter.router,
    },
    plans: {
      fiches: {
        countByStatut : this.countByStatutRouter.router.countByStatut,
        etapes : this.ficheActionEtapeRouter.router,
      },
    },
    collectivites: {
      personnes: this.personnes.router,
    },
    tags: {
      categories : this.getCategoriesByCollectiviteRouter.router
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
