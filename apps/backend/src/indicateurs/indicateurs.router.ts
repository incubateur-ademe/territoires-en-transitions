import { IndicateurPiloteRouter } from '@/backend/indicateurs/pilotes/indicateur-pilote.router';
import { IndicateurServicePiloteRouter } from '@/backend/indicateurs/services-pilotes/indicateur-service-pilote.router';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { UpdateIndicateurRouter } from './update-indicateur/update-indicateur.router';

@Injectable()
export class IndicateursRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly updateIndicateurRouter: UpdateIndicateurRouter,
    private readonly indicateurPiloteRouter: IndicateurPiloteRouter,
    private readonly indicateurServicePiloteRouter: IndicateurServicePiloteRouter,
  ) { }

  router = this.trpc.router({
    indicateurs: this.updateIndicateurRouter.router,
    indicateursPilotes: this.indicateurPiloteRouter.router,
    indicateursServicesPilotes: this.indicateurServicePiloteRouter.router,
  });

  createCaller = this.trpc.createCallerFactory(this.router);
}
