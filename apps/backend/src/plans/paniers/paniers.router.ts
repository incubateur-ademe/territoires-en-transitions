import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { CheckoutRouter } from './checkout/checkout.router';

@Injectable()
export class PaniersRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly checkoutRouter: CheckoutRouter
  ) {}

  router = this.trpc.mergeRouters(this.checkoutRouter.router);

  createCaller = this.trpc.createCallerFactory(this.router);
}
