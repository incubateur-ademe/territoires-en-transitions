import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { ListPlanLinksRouter } from './list-plan-links/list-plan-links.router';
import { PcaetRouter } from './pcaet/pcaet.router';

@Injectable()
export class DemarchesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listPlanLinksRouter: ListPlanLinksRouter,
    private readonly pcaetRouter: PcaetRouter
  ) {}

  router = this.trpc.mergeRouters(
    // Lectures transverses à tous les types de démarches.
    this.listPlanLinksRouter.router,
    this.trpc.router({
      pcaet: this.pcaetRouter.router,
    })
  );

  createCaller = this.trpc.createCallerFactory(this.router);
}
