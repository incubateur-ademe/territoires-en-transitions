import { Injectable } from '@nestjs/common';
import { getTrajectoireLeviersDataRequestSchema } from '@tet/backend/indicateurs/trajectoire-leviers/get-trajectoire-leviers-data.request';
import { TrajectoireLeviersService } from '@tet/backend/indicateurs/trajectoire-leviers/trajectoire-leviers.service';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { trajectoireLeviersErrorConfig } from './trajectoire-leviers.errors';

@Injectable()
export class TrajectoireLeviersRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly trajectoireLeviersService: TrajectoireLeviersService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    trajectoireLeviersErrorConfig
  );

  router = this.trpc.router({
    getData: this.trpc.authedOrServiceRoleProcedure
      .input(getTrajectoireLeviersDataRequestSchema)
      .query(async ({ input, ctx }) =>
        this.getResultDataOrThrowError(
          await this.trajectoireLeviersService.getData(input, ctx.user)
        )
      ),
  });
}
