import { createTrpcErrorHandler } from '@/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { deleteAxeErrorConfig } from './delete-axe.errors';
import { deleteAxeInputSchema } from './delete-axe.input';
import { DeleteAxeService } from './delete-axe.service';

@Injectable()
export class DeleteAxeRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly deleteAxeService: DeleteAxeService
  ) {}

  private readonly getResultDataOrThrowError =
    createTrpcErrorHandler(deleteAxeErrorConfig);

  router = this.trpc.router({
    delete: this.trpc.authedProcedure
      .input(deleteAxeInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.deleteAxeService.deleteAxe(input, ctx.user);
        return this.getResultDataOrThrowError(result);
      }),
  });
}

