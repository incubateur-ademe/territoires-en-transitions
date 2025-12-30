import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { MutateDefinitionRouter } from './definitions/mutate-definition/mutate-definition.router';
import { ListIndicateursRouter } from './indicateurs/list-indicateurs/list-indicateurs.router';
import { IndicateurSourcesRouter } from './sources/indicateur-sources.router';
import { TrajectoiresRouter } from './trajectoires/trajectoires.router';
import { IndicateurValeursRouter } from './valeurs/crud-valeurs.router';

@Injectable()
export class IndicateursRouter {
  constructor(
    private readonly trpc: TrpcService,

    private readonly trajectoiresRouter: TrajectoiresRouter,
    private readonly indicateurValeursRouter: IndicateurValeursRouter,
    private readonly indicateurSourcesRouter: IndicateurSourcesRouter,
    private readonly listIndicateursRouter: ListIndicateursRouter,
    private readonly mutateDefinitionRouter: MutateDefinitionRouter
  ) {}

  router = this.trpc.router({
    indicateurs: this.trpc.mergeRouters(
      this.listIndicateursRouter.router,
      this.mutateDefinitionRouter.router
    ),

    valeurs: this.indicateurValeursRouter.router,
    sources: this.indicateurSourcesRouter.router,
    trajectoires: this.trajectoiresRouter.router,
  });

  createCaller = this.trpc.createCallerFactory(this.router);
}
