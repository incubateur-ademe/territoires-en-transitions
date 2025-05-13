import { getErrorMessage } from '@/backend/utils/nest/errors.utils';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseClient } from '@supabase/supabase-js';
import { initTRPC, TRPCError } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import {
  getStatusKeyFromCode,
  TRPC_ERROR_CODES_BY_KEY,
} from '@trpc/server/unstable-core-do-not-import';
import {
  AuthJwtPayload,
  AuthUser,
  isAnonymousUser,
  isAuthenticatedUser,
  isServiceRoleUser,
  jwtToUser,
} from '../../auth/models/auth.models';
import ConfigurationService from '../../utils/config/configuration.service';
import { ContextStoreService } from '../context/context.service';

@Injectable()
export class TrpcService {
  private readonly logger = new Logger(TrpcService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigurationService,
    private readonly contextStoreService: ContextStoreService
  ) {}

  trpc = initTRPC
    .context<Awaited<ReturnType<typeof this.createContext>>>()
    .create({
      // transformer: superJson,
      errorFormatter({ shape, error }) {
        let code = shape.code;
        let codeKey = shape.data.code;
        let httpStatus = shape.data.httpStatus;

        if (error.cause instanceof HttpException) {
          const httpException = error.cause as HttpException;
          httpStatus = httpException.getStatus();
          codeKey = getStatusKeyFromCode(httpStatus);
          code = TRPC_ERROR_CODES_BY_KEY[codeKey];
        }

        return {
          ...shape,
          data: {
            ...shape.data,
            httpStatus,
            code: codeKey,
          },
          code,
        };
      },
    });

  contextStoreMiddleware = this.trpc.middleware(
    async ({ next, ctx, getRawInput }) => {
      const rawInput = await getRawInput();
      this.contextStoreService.autoSetContextFromPayload(rawInput);

      return next({ ctx: ctx });
    }
  );

  /**
   * Create an unprotected public procedure
   * @see https://trpc.io/docs/v11/procedures
   **/
  publicProcedure = this.trpc.procedure.use(this.contextStoreMiddleware);

  /**
   * Create an anonymous procedure
   * @see https://trpc.io/docs/v11/procedures
   **/
  anonProcedure = this.trpc.procedure.use(
    this.contextStoreMiddleware.unstable_pipe(async ({ next, ctx }) => {
      const user = ctx.user;

      if (
        isAnonymousUser(user) ||
        isAuthenticatedUser(user) ||
        isServiceRoleUser(user)
      ) {
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
    this.contextStoreMiddleware.unstable_pipe(async ({ next, ctx }) => {
      const user = ctx.user;

      if (isAuthenticatedUser(user) || isServiceRoleUser(user)) {
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

    this.contextStoreService.updateContext({
      userId: user.id || undefined,
      authRole: user.role,
    });

    if (!user) {
      return { user: null, decodedToken: jwtPayload };
    }

    return {
      user,
    };
  }
}
