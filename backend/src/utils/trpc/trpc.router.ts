import { ApikeysRouter } from '@/backend/auth/apikeys/apikeys.router';
import { CollectivitesRouter } from '@/backend/collectivites/collectivites.router';
import { IndicateurDefinitionsRouter } from '@/backend/indicateurs/list-definitions/list-definitions.router';
import { ReferentielsRouter } from '@/backend/referentiels/referentiels.router';
import { ContextStoreService } from '@/backend/utils/context/context.service';
import { getSentryContextFromApplicationContext } from '@/backend/utils/sentry-init';
import {
  HttpException,
  INestApplication,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { Response } from 'express';
import z from 'zod';
import { UsersRouter } from '../../auth/users/users.router';
import { IndicateurFiltreRouter } from '../../indicateurs/definitions/indicateur-filtre.router';
import { IndicateurSourcesRouter } from '../../indicateurs/sources/indicateur-sources.router';
import { TrajectoiresRouter } from '../../indicateurs/trajectoires/trajectoires.router';
import { IndicateurValeursRouter } from '../../indicateurs/valeurs/crud-valeurs.router';
import { FichesRouter } from '../../plans/fiches/fiches.router';
import { TrpcService } from './trpc.service';
import { InvitationRouter } from '@/backend/auth/invitation/invitation.router';

@Injectable()
export class TrpcRouter {
  private readonly logger = new Logger(TrpcRouter.name);

  constructor(
    private readonly contextStoreService: ContextStoreService,
    private readonly trpc: TrpcService,
    private readonly apikeysRouter: ApikeysRouter,
    private readonly trajectoiresRouter: TrajectoiresRouter,
    private readonly indicateurFiltreRouter: IndicateurFiltreRouter,
    private readonly indicateurValeursRouter: IndicateurValeursRouter,
    private readonly indicateurSourcesRouter: IndicateurSourcesRouter,
    private readonly indicateurDefinitionsRouter: IndicateurDefinitionsRouter,
    private readonly collectivitesRouter: CollectivitesRouter,
    private readonly referentielsRouter: ReferentielsRouter,
    private readonly usersRouter: UsersRouter,
    private readonly fichesRouter: FichesRouter
    private readonly invitationRouter : InvitationRouter,
  ) {}

  appRouter = this.trpc.router({
    auth: {
      apikeys: this.apikeysRouter.router,
    },
    throwError: this.trpc.anonProcedure
      .input(z.object({}))
      .query(async ({ input, ctx }) => {
        throw new HttpException('A test trpc error occured', 500);
      }),
    utilisateurs: this.usersRouter.router,
    collectivites: this.collectivitesRouter.router,
    indicateurs: {
      trajectoires: this.trajectoiresRouter.router,
      /**
       * @deprecated: should not be used, use definitions whenever poss
       */
      list: this.indicateurFiltreRouter.router.list,
      valeurs: this.indicateurValeursRouter.router,
      definitions: this.indicateurDefinitionsRouter.router,
      sources: this.indicateurSourcesRouter.router,
    },
    plans: {
      fiches: this.fichesRouter.router,
    },
    referentiels: this.referentielsRouter.router,
    invitations : this.invitationRouter.router,
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
          const { error, type, path, input, ctx, req } = opts;
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
