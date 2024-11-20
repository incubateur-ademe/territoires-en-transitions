import { INestApplication, Injectable, Logger } from '@nestjs/common';
import {
  createExpressMiddleware,
  type CreateExpressContextOptions,
} from '@trpc/server/adapters/express';
import { CountByStatutRouter } from '../fiches/routers/count-by-statut.router';
import { TrajectoiresRouter } from '../indicateurs/routers/trajectoires.router';
import { TrpcService } from './trpc.service';
import SupabaseService from '../common/services/supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class TrpcRouter {
  private readonly logger = new Logger(TrpcRouter.name);

  constructor(
    private readonly trpc: TrpcService,
    private readonly supabase: SupabaseService,
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
      createExpressMiddleware({
        router: this.appRouter,
        createContext: (opts) => createContext(this.supabase.client, opts),
      })
    );
  }
}

export type AppRouter = TrpcRouter[`appRouter`];

/**
 * Creates context for an incoming request
 * @see https://trpc.io/docs/v11/context
 */
export async function createContext(
  supabase: SupabaseClient,
  { req }: CreateExpressContextOptions
) {
  // Extract Supabase session from cookies or headers
  const supabaseToken = req.headers.authorization?.split('Bearer ')[1];
  // req.cookies['sb:token'] ||

  try {
    // Verify the token from supabase
    const {
      data: { user },
    } = await supabase.auth.getUser(supabaseToken);

    return {
      user,
    };
  } catch (error) {
    return { user: null };
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>;
