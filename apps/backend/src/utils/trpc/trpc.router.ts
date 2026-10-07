import {
  HttpException,
  INestApplication,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { CollectivitesRouter } from '@tet/backend/collectivites/collectivites.router';
import { DemarchesRouter } from '@tet/backend/demarches/demarches.router';
import { IndicateursRouter } from '@tet/backend/indicateurs/indicateurs.router';
import { MetricsRouter } from '@tet/backend/metrics/metrics.router';
import { PlanMainRouter } from '@tet/backend/plans/plans-main.router';
import { ReferentielsRouter } from '@tet/backend/referentiels/referentiels.router';
import { SharedRouter } from '@tet/backend/shared/shared.router';
import { BannerRouter } from '@tet/backend/utils/banner/banner.router';
import { ContextStoreService } from '@tet/backend/utils/context/context.service';
import { NotificationsRouter } from '@tet/backend/utils/notifications/notifications.router';
import { getSentryContextFromApplicationContext } from '@tet/backend/utils/sentry-init';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import type { Response } from 'express';
import z from 'zod';
import { UsersRouter } from '../../users/users.router';
import { TrpcService } from './trpc.service';

/**
 * Codes d'erreur imputables au client, et non au serveur.
 *
 * Une 401 (non authentifié) ou une 429 (limite d'appels atteinte) est le
 * fonctionnement nominal du contrôle d'accès ou du rate limit, jamais un bug à
 * investiguer : on les journalise en `warn` et on ne les remonte pas dans
 * Sentry. Sinon, sur les procédures publiques, l'abus que le rate limit est
 * justement là pour absorber se transformerait en quota Sentry.
 *
 * Les autres codes 4xx (`BAD_REQUEST` en particulier) restent remontés : sur
 * les routers internes ils signalent en général une vraie incohérence de
 * contrat entre le front et le back.
 */
const CLIENT_FAULT_ERROR_CODES = new Set<string>([
  'UNAUTHORIZED',
  'TOO_MANY_REQUESTS',
]);

@Injectable()
export class TrpcRouter {
  private readonly logger = new Logger(TrpcRouter.name);

  constructor(
    private readonly contextStoreService: ContextStoreService,
    private readonly trpc: TrpcService,
    private readonly indicateursRouter: IndicateursRouter,
    private readonly collectivitesRouter: CollectivitesRouter,
    private readonly referentielsRouter: ReferentielsRouter,
    private readonly usersRouter: UsersRouter,
    private readonly planMainRouter: PlanMainRouter,
    private readonly demarchesRouter: DemarchesRouter,
    private readonly sharedRouter: SharedRouter,
    private readonly metricsRouter: MetricsRouter,
    private readonly notificationsRouter: NotificationsRouter,
    private readonly bannerRouter: BannerRouter
  ) {}

  appRouter = this.trpc.router({
    throwError: this.trpc.anonProcedure.input(z.object({})).query(async () => {
      throw new HttpException('A test trpc error occured', 500);
    }),
    users: this.usersRouter.router,
    collectivites: this.collectivitesRouter.router,
    indicateurs: this.indicateursRouter.router,
    plans: this.planMainRouter.router,
    demarches: this.demarchesRouter.router,
    referentiels: this.referentielsRouter.router,
    shared: this.sharedRouter.router,
    metrics: this.metricsRouter.router,
    notifications: this.notificationsRouter.router,
    banner: this.bannerRouter.router,
  });

  createCaller = this.trpc.createCallerFactory(this.appRouter);

  async applyMiddleware(app: INestApplication) {
    this.logger.log(`Applying trpc middleware`);

    app.use(
      `/trpc`,
      createExpressMiddleware({
        router: this.appRouter,
        createContext: (opts) => this.trpc.createContext(opts),

        onError: (opts) => {
          const { error } = opts;

          if (CLIENT_FAULT_ERROR_CODES.has(error.code)) {
            this.logger.warn(error);
            return;
          }

          this.logger.error(error);

          Sentry.captureException(
            error,
            getSentryContextFromApplicationContext(
              this.contextStoreService.getContext()
            )
          );
        },
      })
    );

    // Access TRPC-UI only in development
    // See https://github.com/aidansunbury/trpc-ui
    app.use(`/trpc-ui`, async (_: Request, res: Response) => {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(404).send('Not Found');
      }

      // Dynamically import renderTrpcPanel
      const { renderTrpcPanel } = await import('trpc-ui');

      res.status(200).send(
        renderTrpcPanel(this.appRouter, {
          url: 'http://localhost:8080/trpc', // Base url of your trpc server
        })
      );
    });
  }
}

export type AppRouter = TrpcRouter[`appRouter`];
