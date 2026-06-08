import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { duplicatePlanErrorConfig } from './duplicate-plan.errors';
import { duplicatePlanInputSchema } from './duplicate-plan.input';
import { DuplicatePlanService } from './duplicate-plan.service';

@Injectable()
export class DuplicatePlanRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly duplicatePlanService: DuplicatePlanService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    duplicatePlanErrorConfig
  );

  router = this.trpc.router({
    duplicate: this.trpc.authedProcedure
      .input(duplicatePlanInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.duplicatePlanService.duplicate(
          input,
          ctx.user
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
