import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseClient } from '@supabase/supabase-js';
import { initTRPC, TRPCError } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import {
  AuthJwtPayload,
  AuthUser,
  isAnonymousUser,
  isAuthenticatedUser,
  jwtToUser,
} from '../../auth/models/auth.models';
import ConfigurationService from '../../utils/config/configuration.service';
import { getErrorMessage } from '../nest/errors.utils';

@Injectable()
export class TrpcService {
  private readonly logger = new Logger(TrpcService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigurationService
  ) {}

  trpc = initTRPC
    .context<Awaited<ReturnType<typeof this.createContext>>>()
    .create({
      // transformer: superJson,
      errorFormatter({ shape }) {
        return shape;
      },
    });

  /**
   * Create an unprotected public procedure
   * @see https://trpc.io/docs/v11/procedures
   **/
  publicProcedure = this.trpc.procedure;

  /**
   * Create an anonymous procedure
   * @see https://trpc.io/docs/v11/procedures
   **/
  anonProcedure = this.trpc.procedure.use(
    this.trpc.middleware(({ next, ctx }) => {
      const user = ctx.user;

      if (isAnonymousUser(user) || isAuthenticatedUser(user)) {
        return next({ ctx: { user } });
      }

      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Not anonymous',
      });
    })
  );

  /**
   * Create an authenticated procedure
   * @see https://trpc.io/docs/v11/procedures
   **/
  authedProcedure = this.trpc.procedure.use(
    this.trpc.middleware(({ next, ctx }) => {
      const user = ctx.user;

      if (isAuthenticatedUser(user)) {
        return next({
          ctx: {
            user,
          },
        });
      }

      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      });
    })
  );

  /**
   * Create a router
   * @see https://trpc.io/docs/v11/router
   */
  router = this.trpc.router;

  /**
   * Merge multiple routers together
   * @see https://trpc.io/docs/v11/merging-routers
   */
  mergeRouters = this.trpc.mergeRouters;

  /**
   * Create a server-side caller
   * @see https://trpc.io/docs/v11/server/server-side-calls
   */
  createCallerFactory = this.trpc.createCallerFactory;

  /**
   * Creates context for an incoming request
   * @see https://trpc.io/docs/v11/context
   */
  async createContext(
    supabase: SupabaseClient,
    { req }: CreateExpressContextOptions
  ) {
    // Extract Supabase session from cookies or headers
    const supabaseToken = req.headers.authorization?.split('Bearer ')[1];

    if (!supabaseToken) {
      return { user: null };
    }

    // Validate JWT token and extract payload
    let jwtPayload: AuthJwtPayload;
    try {
      jwtPayload = await this.jwtService.verifyAsync<AuthJwtPayload>(
        supabaseToken,
        {
          secret: this.config.get('SUPABASE_JWT_SECRET'),
        }
      );
    } catch (err) {
      this.logger.error(`Failed to validate token: ${getErrorMessage(err)}`);
      return { user: null };
    }

    // Convert JWT payload to user
    let user: AuthUser;
    try {
      user = jwtToUser(jwtPayload);
    } catch (err) {
      this.logger.error(`Failed to convert token: ${getErrorMessage(err)}`);
      return { user: null };
    }

    if (!user) {
      return { user: null };
    }

    return {
      user,
    };
  }
}
