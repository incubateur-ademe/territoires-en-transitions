import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { PanierActionsRouter } from './actions/actions.router';
import { CheckoutRouter } from './checkout/checkout.router';

@Injectable()
export class PaniersRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly checkoutRouter: CheckoutRouter,
    private readonly actionsRouter: PanierActionsRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.checkoutRouter.router,
    this.actionsRouter.router
  );

  createCaller = this.trpc.createCallerFactory(this.router);
}
