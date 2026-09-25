import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
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
  /** Fenêtre glissante, en millisecondes. */
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

/**
 * Adresse de l'appelant, pour les limites par IP.
 *
 * Le backend tourne derrière le proxy Koyeb et `trust proxy` n'est pas
 * positionné : `req.ip` vaut alors l'adresse du proxy, ce qui mettrait tout le
 * trafic dans un même seau. On lit donc `x-forwarded-for` en priorité, dont la
 * première entrée est le client (les suivantes sont les proxies traversés).
 *
 * Cet en-tête est falsifiable — la limite décourage les abus grossiers, elle
 * n'est pas une protection anti-abus sérieuse.
 */
export function getClientIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const first = raw?.split(',')[0]?.trim();
  return first || req.ip;
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
   * Le compteur est celui de `@nestjs/throttler`, en mémoire par défaut : les
   * quotas sont donc par instance, et la limite effective est multipliée par
   * le nombre de replicas. Même comportement que les `@Throttle` REST.
   *
   * @example
   * this.trpc.publicProcedure.use(this.trpc.rateLimit({ name: 'contact', limit: 5, ttl: 60_000 }))
   */
  rateLimit({ name, limit, ttl }: RateLimitOptions) {
    return this.trpc.middleware(async ({ next, ctx }) => {
      const key = `trpc:${name}:${ctx.clientIp ?? 'unknown'}`;

      // `blockDuration` doit être non nul : à 0, le stockage remet le compteur
      // à zéro dès qu'il dépasse la limite, et plus rien n'est jamais bloqué.
      // On bloque donc pour la durée d'une fenêtre.
      const { totalHits } = await this.throttlerStorage.increment(
        key,
        ttl,
        limit,
        ttl,
        name
      );

      if (totalHits > limit) {
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
      supabaseUrl
    );

    const supabaseJwt =
      supabaseJwtFromCookie ?? req.headers.authorization?.split('Bearer ')[1];

    if (!supabaseJwt) {
      return { user: null, clientIp };
    }

    try {
      const user = await this.convertJwtToAuthUserService.convertJwtToAuthUser(
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
