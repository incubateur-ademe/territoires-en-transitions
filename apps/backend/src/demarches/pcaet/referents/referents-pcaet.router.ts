import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { AddReferentRouter } from './add-referent/add-referent.router';
import { GetReferentsAccessRouter } from './get-referents-access/get-referents-access.router';
import { ListReferentsOrganismesRouter } from './list-referents-organismes/list-referents-organismes.router';
import { ListReferentsRegionsRouter } from './list-referents-regions/list-referents-regions.router';
import { RemoveReferentRouter } from './remove-referent/remove-referent.router';

@Injectable()
export class ReferentsPcaetRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getReferentsAccessRouter: GetReferentsAccessRouter,
    private readonly listReferentsRegionsRouter: ListReferentsRegionsRouter,
    private readonly listReferentsOrganismesRouter: ListReferentsOrganismesRouter,
    private readonly addReferentRouter: AddReferentRouter,
    private readonly removeReferentRouter: RemoveReferentRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.getReferentsAccessRouter.router,
    this.listReferentsRegionsRouter.router,
    this.listReferentsOrganismesRouter.router,
    this.addReferentRouter.router,
    this.removeReferentRouter.router
  );
}
