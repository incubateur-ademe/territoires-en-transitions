import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { IndicateurDefinitionsRouter } from './definitions/indicateur-definitions.router';
import { IndicateurSourcesRouter } from './sources/indicateur-sources.router';
import { TrajectoiresRouter } from './trajectoires/trajectoires.router';
import { IndicateurValeursRouter } from './valeurs/crud-valeurs.router';

@Injectable()
export class IndicateursRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly indicateurDefinitionsRouter: IndicateurDefinitionsRouter,
    private readonly trajectoiresRouter: TrajectoiresRouter,
    private readonly indicateurValeursRouter: IndicateurValeursRouter,
    private readonly indicateurSourcesRouter: IndicateurSourcesRouter
  ) {}

  router = this.trpc.router({
    definitions: this.indicateurDefinitionsRouter.router,

    valeurs: this.indicateurValeursRouter.router,
    sources: this.indicateurSourcesRouter.router,
    trajectoires: this.trajectoiresRouter.router,
  });

  createCaller = this.trpc.createCallerFactory(this.router);
}
