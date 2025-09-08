import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { IndicateurDefinitionsRouter } from './definitions/indicateur-definitions.router';
import { ListIndicateursRouter } from './definitions/list-indicateurs.router';
import { UpdateIndicateurDefinitionsRouter } from './definitions/update-definitions/update-definitions.router';
import { IndicateurSourcesRouter } from './sources/indicateur-sources.router';
import { TrajectoiresRouter } from './trajectoires/trajectoires.router';
import { IndicateurValeursRouter } from './valeurs/crud-valeurs.router';

@Injectable()
export class IndicateursRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly indicateurDefinitionsRouter: IndicateurDefinitionsRouter,
    private readonly updateIndicateurDefinitionRouter: UpdateIndicateurDefinitionsRouter,
    private readonly trajectoiresRouter: TrajectoiresRouter,
    private readonly indicateurFiltreRouter: ListIndicateursRouter,
    private readonly indicateurValeursRouter: IndicateurValeursRouter,
    private readonly indicateurSourcesRouter: IndicateurSourcesRouter
  ) {}

  router = this.trpc.router({
    definitions: this.indicateurDefinitionsRouter.router,

    valeurs: this.indicateurValeursRouter.router,
    sources: this.indicateurSourcesRouter.router,
    trajectoires: this.trajectoiresRouter.router,

    /**
     * @deprecated: should not be used, use `indicateurs.definitions.list` instead
     */
    list: this.indicateurFiltreRouter.router.list,
  });

  createCaller = this.trpc.createCallerFactory(this.router);
}
