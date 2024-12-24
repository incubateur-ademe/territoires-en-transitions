import { BulkEditRouter } from '@/backend/plans/fiches/bulk-edit/bulk-edit.router';
import { CountByStatutRouter } from '@/backend/plans/fiches/count-by-statut/count-by-statut.router';
import { FicheActionEtapeRouter } from '@/backend/plans/fiches/fiche-action-etape/fiche-action-etape.router';
import { INestApplication, Injectable, Logger } from '@nestjs/common';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { ListCategoriesRouter } from '../../collectivites/handle-categories/list-categories.router';
import { CollectiviteMembresRouter } from '../../collectivites/membres/membres.router';
import { PersonnesRouter } from '../../collectivites/personnes.router';
import { IndicateurFiltreRouter } from '../../indicateurs/list-indicateurs/indicateur-filtre.router';
import { TrajectoiresRouter } from '../../indicateurs/trajectoires/trajectoires.router';
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
    private readonly countByStatutRouter: CountByStatutRouter,
    private readonly getCategoriesByCollectiviteRouter: ListCategoriesRouter,
    private readonly personnes: PersonnesRouter,
    private readonly ficheActionEtapeRouter: FicheActionEtapeRouter,
    private readonly indicateurFiltreRouter: IndicateurFiltreRouter,
    private readonly bulkEditRouter: BulkEditRouter,
    private readonly membresRouter: CollectiviteMembresRouter,
    private readonly updateActionStatutRouter: UpdateActionStatutRouter,
    private readonly scoreSnapshotsRouter: ScoreSnapshotsRouter,
    private readonly computeScoreRouter: ComputeScoreRouter
  ) {}

  appRouter = this.trpc.router({
    indicateurs: {
      trajectoires: this.trajectoiresRouter.router,
      list: this.indicateurFiltreRouter.router.list,
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
      categories: this.getCategoriesByCollectiviteRouter.router,
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
