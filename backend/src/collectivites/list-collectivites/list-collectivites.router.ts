import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import ListCollectivitesService, {
  inputSchema,
} from './list-collectivites.service';

@Injectable()
export class ListCollectivitesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ListCollectivitesService
  ) {}

  router = this.trpc.router({
    list: this.trpc.publicProcedure
      .input(inputSchema)
      .query(({ ctx, input }) => {
        // const { text } = input;
        return this.service.listCollectivites(input);
      }),
  });
}
