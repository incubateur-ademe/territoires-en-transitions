import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { GetCollectiviteRouter } from './get-collectivite/get-collectivite.router';
import { GetDossierRouter } from './get-dossier/get-dossier.router';
import { ListCollectivitesRouter } from './list-collectivites/list-collectivites.router';

@Injectable()
export class RepriseTecRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listCollectivitesRouter: ListCollectivitesRouter,
    private readonly getCollectiviteRouter: GetCollectiviteRouter,
    private readonly getDossierRouter: GetDossierRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.listCollectivitesRouter.router,
    this.getCollectiviteRouter.router,
    this.getDossierRouter.router
  );
}
