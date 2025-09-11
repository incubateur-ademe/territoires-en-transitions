import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { bulkEditRequestSchema } from './bulk-edit.request';
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
