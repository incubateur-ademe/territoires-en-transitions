import { Injectable } from '@nestjs/common';
import { initTRPC, TRPCError } from '@trpc/server';
import {
  isAnonymousUser,
  isAuthenticatedUser,
} from '../auth/models/authenticated-user.models';
import { Context } from './trpc.router';

@Injectable()
export class TrpcService {
  trpc = initTRPC.context<Context>().create({
    // transformer: superJson,
    errorFormatter({ shape }) {
      return shape;
    },
  });

  publicProcedure = this.trpc.procedure;

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

  router = this.trpc.router;
  mergeRouters = this.trpc.mergeRouters;
}
