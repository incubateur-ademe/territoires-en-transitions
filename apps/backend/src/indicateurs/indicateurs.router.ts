import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { UpdateIndicateurRouter } from './update-indicateur/update-indicateur.router';

@Injectable()
export class IndicateursRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly updateIndicateurRouter: UpdateIndicateurRouter,
  ) { }

  router = this.trpc.mergeRouters(
    this.updateIndicateurRouter.router,
  );

  createCaller = this.trpc.createCallerFactory(this.router);
}
