import { Injectable } from '@nestjs/common';
import { getTrajectoireLeviersDataRequestSchema } from '@tet/backend/indicateurs/trajectoire-leviers/get-trajectoire-leviers-data.request';
import { TrajectoireLeviersService } from '@tet/backend/indicateurs/trajectoire-leviers/trajectoire-leviers.service';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';

@Injectable()
export class TrajectoireLeviersRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly trajectoireLeviersService: TrajectoireLeviersService
  ) {}

  router = this.trpc.router({
    getData: this.trpc.authedOrServiceRoleProcedure
      .input(getTrajectoireLeviersDataRequestSchema)
      .query(({ input, ctx }) => {
        return this.trajectoireLeviersService.getData(input, ctx.user);
      }),
  });
}
