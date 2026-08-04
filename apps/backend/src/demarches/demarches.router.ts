import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { PcaetRouter } from './pcaet/pcaet.router';

@Injectable()
export class DemarchesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly pcaetRouter: PcaetRouter
  ) {}

  router = this.trpc.router({
    pcaet: this.pcaetRouter.router,
  });

  createCaller = this.trpc.createCallerFactory(this.router);
}
