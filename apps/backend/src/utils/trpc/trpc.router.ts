import { CollectivitesRouter } from '@/backend/collectivites/collectivites.router';
import { IndicateursRouter } from '@/backend/indicateurs/indicateurs.router';
import { MetricsRouter } from '@/backend/metrics/metrics.router';
import { ReferentielsRouter } from '@/backend/referentiels/referentiels.router';
import { ContextStoreService } from '@/backend/utils/context/context.service';
import { NotificationsRouter } from '@/backend/utils/notifications/notifications.router';
import { getSentryContextFromApplicationContext } from '@/backend/utils/sentry-init';
import {
  HttpException,
  INestApplication,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import type { Response } from 'express';
import z from 'zod';
import { FichesRouter } from '../../plans/fiches/fiches.router';
import { CompletionAnalyticsRouter } from '../../plans/plans/completion-analytics/completion-analytics.router';
import { PlanRouter } from '../../plans/plans/plans.router';
import { UsersRouter } from '../../users/users.router';
import { TrpcService } from './trpc.service';

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
    private readonly fichesRouter: FichesRouter,
    private readonly planRouter: PlanRouter,
    private readonly completionAnalyticsRouter: CompletionAnalyticsRouter,
    private readonly metricsRouter: MetricsRouter,
    private readonly notificationsRouter: NotificationsRouter
  ) {}

  appRouter = this.trpc.router({
    throwError: this.trpc.anonProcedure.input(z.object({})).query(async () => {
      throw new HttpException('A test trpc error occured', 500);
    }),
    users: this.usersRouter.router,
    collectivites: this.collectivitesRouter.router,
    indicateurs: this.indicateursRouter.router,
    plans: {
      fiches: this.fichesRouter.router,
      plans: this.planRouter.router,
      completionAnalytics: this.completionAnalyticsRouter.router,
    },
    referentiels: this.referentielsRouter.router,
    metrics: this.metricsRouter.router,
    notifications: this.notificationsRouter.router,
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
          this.logger.error(error);

          // report it to sentry with context
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
