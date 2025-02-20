import { CollectivitesRouter } from '@/backend/collectivites/collectivites.router';
import { BulkEditRouter } from '@/backend/plans/fiches/bulk-edit/bulk-edit.router';
import { CountByRouter } from '@/backend/plans/fiches/count-by/count-by.router';
import { FicheActionEtapeRouter } from '@/backend/plans/fiches/fiche-action-etape/fiche-action-etape.router';
import { ImportPlanRouter } from '@/backend/plans/fiches/import/import-plan.router';
import { ReferentielsRouter } from '@/backend/referentiels/referentiels.router';
import { INestApplication, Injectable, Logger } from '@nestjs/common';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { IndicateurFiltreRouter } from '../../indicateurs/definitions/indicateur-filtre.router';
import { IndicateurDefinitionsRouter } from '../../indicateurs/definitions/list-definitions.router';
import { IndicateurSourcesRouter } from '../../indicateurs/sources/indicateur-sources.router';
import { TrajectoiresRouter } from '../../indicateurs/trajectoires/trajectoires.router';
import { IndicateurValeursRouter } from '../../indicateurs/valeurs/crud-valeurs.router';
import SupabaseService from '../database/supabase.service';
import { TrpcService } from './trpc.service';

@Injectable()
export class TrpcRouter {
  private readonly logger = new Logger(TrpcRouter.name);

  constructor(
    private readonly trpc: TrpcService,
    private readonly supabase: SupabaseService,
    private readonly trajectoiresRouter: TrajectoiresRouter,
    private readonly countByRouter: CountByRouter,
    private readonly ficheActionEtapeRouter: FicheActionEtapeRouter,
    private readonly indicateurFiltreRouter: IndicateurFiltreRouter,
    private readonly indicateurValeursRouter: IndicateurValeursRouter,
    private readonly indicateurSourcesRouter: IndicateurSourcesRouter,
    private readonly indicateurDefinitionsRouter: IndicateurDefinitionsRouter,
    private readonly bulkEditRouter: BulkEditRouter,
    private readonly collectivitesRouter: CollectivitesRouter,
    private readonly referentielsRouter: ReferentielsRouter,
    private readonly importRouter: ImportPlanRouter
  ) {}

  appRouter = this.trpc.router({
    collectivites: this.collectivitesRouter.router,
    indicateurs: {
      trajectoires: this.trajectoiresRouter.router,
      list: this.indicateurFiltreRouter.router.list,
      valeurs: this.indicateurValeursRouter.router,
      definitions: this.indicateurDefinitionsRouter.router,
      sources: this.indicateurSourcesRouter.router,
    },
    plans: {
      fiches: this.trpc.mergeRouters(
        this.countByRouter.router,
        this.bulkEditRouter.router,
        this.ficheActionEtapeRouter.router,
        this.importRouter.router
      ),
    },
    referentiels: this.referentielsRouter.router,
  });

  createCaller = this.trpc.createCallerFactory(this.appRouter);

  async applyMiddleware(app: INestApplication) {
    this.logger.log(`Applying trpc middleware`);
    app.use(
      `/trpc`,
      createExpressMiddleware({
        router: this.appRouter,
        createContext: (opts) =>
          this.trpc.createContext(this.supabase.client, opts),
      })
    );
  }
}

export type AppRouter = TrpcRouter[`appRouter`];
