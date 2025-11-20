import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { bulkEditRequestSchema } from './bulk-edit.input';
import { BulkEditService } from './bulk-edit.service';

@Injectable()
export class BulkEditRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: BulkEditService
  ) {}

  router = this.trpc.router({
    bulkEdit: this.trpc.authedProcedure
      .input(bulkEditRequestSchema)
      .mutation(({ input, ctx }) => {
        return this.service.bulkEdit(input, ctx.user);
      }),
  });
}
