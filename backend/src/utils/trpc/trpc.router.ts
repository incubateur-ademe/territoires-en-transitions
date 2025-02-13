import { CollectivitesRouter } from '@/backend/collectivites/collectivites.router';
import { BulkEditRouter } from '@/backend/plans/fiches/bulk-edit/bulk-edit.router';
import { CountByRouter } from '@/backend/plans/fiches/count-by/count-by.router';
import { FicheActionEtapeRouter } from '@/backend/plans/fiches/fiche-action-etape/fiche-action-etape.router';
import { INestApplication, Injectable, Logger } from '@nestjs/common';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { IndicateurFiltreRouter } from '../../indicateurs/definitions/indicateur-filtre.router';
import { IndicateurDefinitionsRouter } from '../../indicateurs/definitions/list-definitions.router';
import { IndicateurSourcesRouter } from '../../indicateurs/sources/indicateur-sources.router';
import { TrajectoiresRouter } from '../../indicateurs/trajectoires/trajectoires.router';
import { IndicateurValeursRouter } from '../../indicateurs/valeurs/crud-valeurs.router';
import { ComputeScoreRouter } from '../../referentiels/compute-score/compute-score.router';
import { ScoreSnapshotsRouter } from '../../referentiels/snapshots/score-snaphots.router';
import { UpdateActionStatutRouter } from '../../referentiels/update-action-statut/update-action-statut.router';
import SupabaseService from '../database/supabase.service';
import { createContext, TrpcService } from './trpc.service';

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
    private readonly updateActionStatutRouter: UpdateActionStatutRouter,
    private readonly scoreSnapshotsRouter: ScoreSnapshotsRouter,
    private readonly computeScoreRouter: ComputeScoreRouter,
    private readonly collectivitesRouter: CollectivitesRouter
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
        this.ficheActionEtapeRouter.router
      ),
    },
    referentiels: {
      actions: this.updateActionStatutRouter.router,
      snapshots: this.scoreSnapshotsRouter.router,
      scores: this.computeScoreRouter.router,
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
