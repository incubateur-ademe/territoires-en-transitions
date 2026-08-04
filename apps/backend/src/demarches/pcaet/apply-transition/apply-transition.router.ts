import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { applyTransitionErrorConfig } from './apply-transition.errors';
import { applyTransitionInputSchema } from './apply-transition.input';
import { ApplyTransitionService } from './apply-transition.service';

@Injectable()
export class ApplyTransitionRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly applyTransitionService: ApplyTransitionService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    applyTransitionErrorConfig
  );

  router = this.trpc.router({
    applyTransition: this.trpc.authedProcedure
      .input(applyTransitionInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.applyTransitionService.applyTransition(
          input,
          { user: ctx.user }
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
