import { TableauDeBordCollectiviteRouter } from '@/backend/collectivites/tableau-de-bord/tableau-de-bord-collectivite.router';
import { BulkEditRouter } from '@/backend/plans/fiches/bulk-edit/bulk-edit.router';
import { CountByRouter } from '@/backend/plans/fiches/count-by/count-by.router';
import { FicheActionEtapeRouter } from '@/backend/plans/fiches/fiche-action-etape/fiche-action-etape.router';
import { INestApplication, Injectable, Logger } from '@nestjs/common';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { ListCategoriesRouter } from '../../collectivites/handle-categories/list-categories.router';
import { CollectiviteMembresRouter } from '../../collectivites/membres/membres.router';
import { PersonnesRouter } from '../../collectivites/personnes.router';
import { IndicateurFiltreRouter } from '../../indicateurs/definitions/indicateur-filtre.router';
import { IndicateurDefinitionsRouter } from '../../indicateurs/definitions/list-definitions.router';
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
    private readonly getCategoriesByCollectiviteRouter: ListCategoriesRouter,
    private readonly personnes: PersonnesRouter,
    private readonly tableauxDeBordCollectiviteRouter: TableauDeBordCollectiviteRouter,
    private readonly ficheActionEtapeRouter: FicheActionEtapeRouter,
    private readonly indicateurFiltreRouter: IndicateurFiltreRouter,
    private readonly indicateurValeursRouter: IndicateurValeursRouter,
    private readonly indicateurDefinitionsRouter: IndicateurDefinitionsRouter,
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
      valeurs: this.indicateurValeursRouter.router,
      definitions: this.indicateurDefinitionsRouter.router,
    },
    plans: {
      fiches: this.trpc.mergeRouters(
        this.countByRouter.router,
        this.bulkEditRouter.router,
        this.ficheActionEtapeRouter.router
      ),
    },
    collectivites: {
      personnes: this.personnes.router,
      membres: this.membresRouter.router,
      tableauDeBord: this.tableauxDeBordCollectiviteRouter.router,
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
