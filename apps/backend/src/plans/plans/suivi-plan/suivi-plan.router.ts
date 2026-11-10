import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { GetVueEnsembleRouter } from './get-vue-ensemble/get-vue-ensemble.router';

@Injectable()
export class SuiviPlanRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getVueEnsembleRouter: GetVueEnsembleRouter
  ) {}

  router = this.trpc.mergeRouters(this.getVueEnsembleRouter.router);
}
