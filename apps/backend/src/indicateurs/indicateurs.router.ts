import { IndicateurDefinitionPiloteRouter } from '@/backend/indicateurs/definitions/handle-definition-pilote/indicateur-definition-pilote.router';
import { IndicateurDefinitionServiceTagRouter } from '@/backend/indicateurs/definitions/handle-definition-service-tag/indicateur-definition-service-tag.router';
import { IndicateurDefinitionThematiqueRouter } from '@/backend/indicateurs/definitions/handle-definition-thematique/indicateur-definition-thematique.router';
import { UpdateIndicateurRouter } from '@/backend/indicateurs/definitions/update-indicateur-definition.router';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class IndicateursRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly updateIndicateurRouter: UpdateIndicateurRouter,
    private readonly indicateurPiloteRouter: IndicateurDefinitionPiloteRouter,
    private readonly indicateurDefinitionServiceTagRouter: IndicateurDefinitionServiceTagRouter,
    private readonly indicateurThematiqueRouter: IndicateurDefinitionThematiqueRouter,
  ) { }

  router = this.trpc.router({
    indicateurs: this.updateIndicateurRouter.router,
    indicateursPilotes: this.indicateurPiloteRouter.router,
    indicateursServicesPilotes: this.indicateurDefinitionServiceTagRouter.router,
    indicateursThematiques: this.indicateurThematiqueRouter.router,
  });

  createCaller = this.trpc.createCallerFactory(this.router);
}
