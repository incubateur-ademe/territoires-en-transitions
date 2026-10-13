import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { GetCollectiviteRouter } from './get-collectivite/get-collectivite.router';
import { GetDossierRouter } from './get-dossier/get-dossier.router';
import { GetEntonnoirRouter } from './get-entonnoir/get-entonnoir.router';
import { ListCasTypesRouter } from './list-cas-types/list-cas-types.router';
import { ListCollectivitesRouter } from './list-collectivites/list-collectivites.router';
import { ListDecisionsRouter } from './list-decisions/list-decisions.router';

@Injectable()
export class RepriseTecRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listCollectivitesRouter: ListCollectivitesRouter,
    private readonly getCollectiviteRouter: GetCollectiviteRouter,
    private readonly getDossierRouter: GetDossierRouter,
    private readonly getEntonnoirRouter: GetEntonnoirRouter,
    private readonly listCasTypesRouter: ListCasTypesRouter,
    private readonly listDecisionsRouter: ListDecisionsRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.listCollectivitesRouter.router,
    this.getCollectiviteRouter.router,
    this.getDossierRouter.router,
    this.getEntonnoirRouter.router,
    this.listCasTypesRouter.router,
    this.listDecisionsRouter.router
  );
}
