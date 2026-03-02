import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { SetPersonnalisationReponseRouter } from './set-personnalisation-reponse/set-personnalisation-reponse.router';

@Injectable()
export class PersonnalisationsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly setReponse: SetPersonnalisationReponseRouter
  ) {}

  router = this.trpc.mergeRouters(this.setReponse.router);
}
