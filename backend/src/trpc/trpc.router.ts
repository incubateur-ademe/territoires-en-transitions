import { INestApplication, Injectable, Logger } from '@nestjs/common';
import * as trpcExpress from '@trpc/server/adapters/express';
import { TrpcService } from './trpc.service';
import { TrajectoiresRouter } from '../indicateurs/routers/trajectoires.router';
import { SyntheseRouter } from '../fiches/routers/synthese.router';

@Injectable()
export class TrpcRouter {
  private readonly logger = new Logger(TrpcRouter.name);

  constructor(
    private readonly trpc: TrpcService,
    private readonly trajectoiresRouter: TrajectoiresRouter,
    private readonly ficheActionSyntheserouter: SyntheseRouter
  ) {}

  appRouter = this.trpc.router({
    trajectoires: this.trajectoiresRouter.router,
    ficheActions: {
      ...this.ficheActionSyntheserouter.router,
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
