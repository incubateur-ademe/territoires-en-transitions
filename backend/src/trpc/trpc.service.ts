import { Injectable } from '@nestjs/common';
import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './trpc.router';
import { AuthenticatedUser } from '../auth/models/authenticated-user.models';

@Injectable()
export class TrpcService {
  trpc = initTRPC.context<Context>().create({
    // transformer: superJson,
    errorFormatter({ shape }) {
      return shape;
    },
  });

  publicProcedure = this.trpc.procedure;

  authedProcedure = this.trpc.procedure.use(
    this.trpc.middleware(({ next, ctx }) => {
      if (ctx.user === null) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      return next({
        ctx: {
          user: ctx.user as AuthenticatedUser,
        },
      });
    })
  );

  router = this.trpc.router;
  mergeRouters = this.trpc.mergeRouters;
}
