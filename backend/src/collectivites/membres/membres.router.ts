import { Injectable } from '@nestjs/common';
import { TrpcService } from '@/backend/utils';
import { CollectiviteMembresService } from './membres.service';

@Injectable()
export class CollectiviteMembresRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: CollectiviteMembresService
  ) {}

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(this.service.listInputSchema)
      .query(({ input }) => this.service.list(input)),

    update: this.trpc.authedProcedure
      .input(this.service.updateInputSchema)
      .mutation(({ input }) => this.service.update(input)),
  });
}
