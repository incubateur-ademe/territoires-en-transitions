import { getMondrianLeviersDataRequestSchema } from '@/backend/indicateurs/mondrian/get-mondrian-leviers-data.request';
import { MondrianLeviersService } from '@/backend/indicateurs/mondrian/mondrian-leviers.service';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MondrianLeviersRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly mondrianLeviersService: MondrianLeviersService
  ) {}

  router = this.trpc.router({
    getData: this.trpc.authedOrServiceRoleProcedure
      .input(getMondrianLeviersDataRequestSchema)
      .query(({ input, ctx }) => {
        return this.mondrianLeviersService.getData(input, ctx.user);
      }),
  });
}
