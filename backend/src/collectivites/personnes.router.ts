import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { AuthService } from '../auth/services/auth.service';
import { TrpcService } from '../trpc/trpc.service';
import {
  listRequestSchema,
  PersonnesService,
} from './shared/services/personnes.service';

const inputSchema = listRequestSchema;

@Injectable()
export class PersonnesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly auth: AuthService,
    private readonly service: PersonnesService
  ) {}

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(inputSchema)
      .query(async ({ input, ctx }) => {
        const authorized = await this.auth.verifieAccesRestreintCollectivite(
          ctx.user,
          input.collectiviteId,
          true
        );

        if (!authorized) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User is not authorized to access this collectivité',
          });
        }

        return this.service.list(input);
      }),
  });
}
