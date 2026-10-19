import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { normalizeIp, ThrottlerStorage } from '@nestjs/throttler';
import { initTRPC, TRPCError } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import type { Request } from 'express';
import {
  getStatusKeyFromCode,
  TRPC_ERROR_CODES_BY_KEY,
} from '@trpc/server/unstable-core-do-not-import';
import { ConvertJwtToAuthUserService } from '../../users/convert-jwt-to-auth-user.service';
import {
  AuthUser,
  isAnonymousUser,
  isAuthenticatedUser,
  isServiceRoleUser,
} from '../../users/models/auth.models';
import ConfigurationService from '../config/configuration.service';
import { ContextStoreService } from '../context/context.service';
import { extractAccessTokenFromSupabaseCookie } from '../supabase/supabase-cookie-parser';

/**
 * Paramètres d'une limite d'appels.
 *
 * `name` isole les compteurs entre procédures : deux procédures limitées
 * n'entament pas le même quota.
 */
export type RateLimitOptions = {
  name: string;
  /** Nombre d'appels autorisés par `ttl`. */
  limit: number;
  /** Durée de la fenêtre de comptage, en millisecondes. */
  ttl: number;
};

/**
 * Contexte d'une requête tRPC.
 *
 * `clientIp` est facultatif — et doit le rester : les appels côté serveur
 * (`createCaller`, tests e2e) construisent leur contexte à la main, sans
 * requête HTTP d'où la tirer.
 */
export type TrpcContext = {
  user: AuthUser | null;
  clientIp?: string;
};

/** Address selected by Express using the configured trusted proxy boundary. */
export function getClientIp(req: Pick<Request, 'ip'>): string | undefined {
  return req.ip ? normalizeIp(req.ip) : undefined;
}

@Injectable()
export class TrpcService {
  private readonly logger = new Logger(TrpcService.name);

  constructor(
    private readonly contextStoreService: ContextStoreService,
    private readonly convertJwtToAuthUserService: ConvertJwtToAuthUserService,
    private readonly config: ConfigurationService,
    @Inject(ThrottlerStorage)
    private readonly throttlerStorage: ThrottlerStorage
  ) {}

  trpc = initTRPC
    .context<Awaited<ReturnType<typeof this.createContext>>>()
    .create({
      // transformer: superJson,
      errorFormatter({ shape, error }) {
        let code = shape.code;
        let codeKey = shape.data.code;
        let httpStatus = shape.data.httpStatus;
        let errorKey: string | undefined;

        if (error.cause instanceof HttpException) {
          const httpException = error.cause as HttpException;
          httpStatus = httpException.getStatus();
          codeKey = getStatusKeyFromCode(httpStatus);
          code = TRPC_ERROR_CODES_BY_KEY[codeKey];
        } else if (error.cause instanceof Error) {
          errorKey = error.cause.message;
        }

        return {
          ...shape,
          data: {
            ...shape.data,
            httpStatus,
            code: codeKey,
            errorKey,
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
   * Limite le nombre d'appels par IP sur la procédure à laquelle on la branche.
   *
   * À poser explicitement sur les procédures ouvertes : le `ThrottlerGuard`
   * global de NestJS ne les couvre pas. Le routeur tRPC est monté via
   * `app.use('/trpc', createExpressMiddleware(...))` (cf. `trpc.router.ts`),
   * un middleware Express brut que les guards ne traversent pas.
   *
   * Le stockage Redis est partagé avec les guards REST : les quotas sont
   * communs aux replicas. Les adresses IPv6 partagent un compteur par /64.
   *
   * @example
   * this.trpc.publicProcedure.use(this.trpc.rateLimit({ name: 'contact', limit: 5, ttl: 60_000 }))
   */
  rateLimit({ name, limit, ttl }: RateLimitOptions) {
    return this.trpc.middleware(async ({ next, ctx }) => {
      const key = `trpc:${name}:${ctx.clientIp ? normalizeIp(ctx.clientIp) : 'unknown'}`;

      // `blockDuration` doit être non nul : à 0, le stockage remet le compteur
      // à zéro dès qu'il dépasse la limite, et plus rien n'est jamais bloqué.
      // On bloque donc pour la durée d'une fenêtre.
      const { isBlocked } = await this.throttlerStorage.increment(
        key,
        ttl,
        limit,
        ttl,
        name
      );

      if (isBlocked) {
        this.logger.warn(`Limite d'appels atteinte pour ${key}`);
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Trop de requêtes, merci de réessayer dans un instant',
        });
      }

      return next();
    });
  }

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
   * Extracts Supabase session from cookies (cookie-based auth) or Authorization header (Bearer token)
   * @see https://trpc.io/docs/v11/context
   */
  async createContext({
    req,
  }: CreateExpressContextOptions): Promise<TrpcContext> {
    const supabaseUrl = this.config.get('SUPABASE_URL');

    // Facultatif : les appels côté serveur (`createCaller`, tests) construisent
    // leur contexte à la main et n'en ont pas. `rateLimit` retombe alors sur un
    // seau commun.
    const clientIp = getClientIp(req);

    const supabaseJwtFromCookie = await extractAccessTokenFromSupabaseCookie(
      req,
      supabaseUrl,
      this.config.get('SUPABASE_AUTH_COOKIE_NAME')
    );

    const supabaseJwt =
      supabaseJwtFromCookie ?? req.headers.authorization?.split('Bearer ')[1];

    if (!supabaseJwt) {
      return { user: null, clientIp };
    }

    try {
      const user =
        await this.convertJwtToAuthUserService.convertJwtToAuthUser(
          supabaseJwt
        );

      this.contextStoreService.updateContext({
        userId: user.id || undefined,
        authRole: user.role,
      });

      return { user, clientIp };
    } catch {
      return { user: null, clientIp };
    }
  }
}
