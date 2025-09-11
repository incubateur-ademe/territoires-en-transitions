import { getTrajectoireLeviersDataRequestSchema } from '@/backend/indicateurs/trajectoire-leviers/get-trajectoire-leviers-data.request';
import { TrajectoireLeviersService } from '@/backend/indicateurs/trajectoire-leviers/trajectoire-leviers.service';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';

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
