import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { checkoutErrorConfig } from './checkout.errors';
import { checkoutInputSchema } from './checkout.input';
import { CheckoutService } from './checkout.service';

@Injectable()
export class CheckoutRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly checkoutService: CheckoutService
  ) {}

  private readonly getResultDataOrThrowError =
    createTrpcErrorHandler(checkoutErrorConfig);

  router = this.trpc.router({
    checkout: this.trpc.authedProcedure
      .input(checkoutInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.checkoutService.execute(input, ctx.user);
        return this.getResultDataOrThrowError(result);
      }),
  });
}
