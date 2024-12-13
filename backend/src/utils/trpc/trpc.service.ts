import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { initTRPC, TRPCError } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import {
  AuthUser,
  isAnonymousUser,
  isAuthenticatedUser,
} from '../../auth/models/auth.models';

@Injectable()
export class TrpcService {
  trpc = initTRPC.context<Context>().create({
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
      const anonUser = ctx.user;

      if (!isAnonymousUser(anonUser)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not anonymous',
        });
      }

      return next({ ctx: { user: anonUser } });
    })
  );

  /**
   * Create an authenticated procedure
   * @see https://trpc.io/docs/v11/procedures
   **/
  authedProcedure = this.trpc.procedure.use(
    this.trpc.middleware(({ next, ctx }) => {
      const authUser = ctx.user;

      if (!isAuthenticatedUser(authUser)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      return next({
        ctx: {
          user: authUser,
        },
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
}

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

  try {
    // Verify the token from supabase
    const {
      data: { user },
    } = await supabase.auth.getUser(supabaseToken);

    if (!user) {
      return { user: null };
    }

    return {
      user: {
        id: user.id ?? null,
        role: user.role,
        isAnonymous: user.is_anonymous,
      } as AuthUser,
    };
  } catch (error) {
    return { user: null };
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>;
