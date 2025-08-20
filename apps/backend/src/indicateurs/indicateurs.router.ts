import { IndicateurPiloteRouter } from '@/backend/indicateurs/pilotes/indicateur-pilote.router';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { UpdateIndicateurRouter } from './update-indicateur/update-indicateur.router';

@Injectable()
export class IndicateursRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly updateIndicateurRouter: UpdateIndicateurRouter,
    private readonly indicateurPiloteRouter: IndicateurPiloteRouter,
  ) { }

  router = this.trpc.mergeRouters(
    this.updateIndicateurRouter.router,
    this.indicateurPiloteRouter.router,
  );

  createCaller = this.trpc.createCallerFactory(this.router);
}
