import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { ListCollectivitesRouter } from './list-collectivites/list-collectivites.router';

@Injectable()
export class RepriseTecRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listCollectivitesRouter: ListCollectivitesRouter
  ) {}

  router = this.trpc.mergeRouters(this.listCollectivitesRouter.router);
}
