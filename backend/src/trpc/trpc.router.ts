import { INestApplication, Injectable, Logger } from '@nestjs/common';
import * as trpcExpress from '@trpc/server/adapters/express';
import { TrpcService } from './trpc.service';
import { TrajectoiresRouter } from '../indicateurs/routers/trajectoires.router';
import { CountByStatutRouter } from '../fiches/routers/count-by-statut.router';

@Injectable()
export class TrpcRouter {
  private readonly logger = new Logger(TrpcRouter.name);

  constructor(
    private readonly trpc: TrpcService,
    private readonly trajectoiresRouter: TrajectoiresRouter,
    private readonly countByStatutRouter: CountByStatutRouter
  ) {}

  appRouter = this.trpc.router({
    trajectoires: this.trajectoiresRouter.router,
    plans: {
      fiches: {
        ...this.countByStatutRouter.router,
      },
    },
  });

  async applyMiddleware(app: INestApplication) {
    this.logger.log(`Applying trpc middleware`);
    app.use(
      `/trpc`,
      trpcExpress.createExpressMiddleware({
        router: this.appRouter,
      })
    );
  }
}

export type AppRouter = TrpcRouter[`appRouter`];
