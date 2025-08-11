import { HttpException, Injectable, Logger } from '@nestjs/common';
import { initTRPC, TRPCError } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import {
  getStatusKeyFromCode,
  TRPC_ERROR_CODES_BY_KEY,
} from '@trpc/server/unstable-core-do-not-import';
import { ConvertJwtToAuthUserService } from '../../users/convert-jwt-to-auth-user.service';
import {
  isAnonymousUser,
  isAuthenticatedUser,
  isServiceRoleUser,
} from '../../users/models/auth.models';
import { ContextStoreService } from '../context/context.service';

@Injectable()
export class TrpcService {
  private readonly logger = new Logger(TrpcService.name);

  constructor(
    private readonly contextStoreService: ContextStoreService,
    private readonly convertJwtToAuthUserService: ConvertJwtToAuthUserService
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

  authedOrServiceRoleProcedure = this.trpc.procedure.use(
    this.contextStoreMiddleware.unstable_pipe(async ({ next, ctx }) => {
      const user = ctx.user;

      if (isAuthenticatedUser(user) || isServiceRoleUser(user)) {
        return next({ ctx: { user } });
      }

      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Not authenticated or service role',
      });
    })
  );

  serviceRoleProcedure = this.trpc.procedure.use(
    this.contextStoreMiddleware.unstable_pipe(async ({ next, ctx }) => {
      const user = ctx.user;

      if (isServiceRoleUser(user)) {
        return next({ ctx: { user } });
      }

      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Not service role',
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
  async createContext({ req }: CreateExpressContextOptions) {
    // Extract Supabase session from cookies or headers
    const supabaseToken = req.headers.authorization?.split('Bearer ')[1];

    if (!supabaseToken) {
      return { user: null };
    }

    const user = await this.convertJwtToAuthUserService.convertJwtToAuthUser(
      supabaseToken
    );

    this.contextStoreService.updateContext({
      userId: user.id || undefined,
      authRole: user.role,
    });

    if (!user) {
      return { user: null };
    }

    return {
      user,
    };
  }
}
