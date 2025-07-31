import { listCollectiviteInputSchema } from '@/backend/collectivites/list-collectivites/list-collectivites.input';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import ListCollectivitesService from './list-collectivites.service';

@Injectable()
export class ListCollectivitesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ListCollectivitesService
  ) {}

  router = this.trpc.router({
    list: this.trpc.anonProcedure
      .input(listCollectiviteInputSchema)
      .query(async ({ input }) => {
        const response = await this.service.listCollectivites(input);
        return response.data;
      }),
  });
}
