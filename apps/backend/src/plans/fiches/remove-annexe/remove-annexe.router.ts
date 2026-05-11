import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import z from 'zod';
import { removeAnnexeInputSchema } from './remove-annexe.input';
import { RemoveAnnexeService } from './remove-annexe.service';

@Injectable()
export class RemoveAnnexeRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly removeAnnexeService: RemoveAnnexeService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler();

  router = this.trpc.router({
    removeAnnexe: this.trpc.authedProcedure
      .input(removeAnnexeInputSchema)
      .output(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx: { user } }) => {
        const result = await this.removeAnnexeService.removeAnnexe(input, user);
        return this.getResultDataOrThrowError(result);
      }),
  });
}
