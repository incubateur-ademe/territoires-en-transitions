import { Injectable } from '@nestjs/common';

import { TrpcClientService } from '../utils/trpc/trpc-client.service';

/**
 * Rejoue le calcul des départements et régions qu'un EPCI couvre au-delà de son
 * siège, depuis la composition communale BANATIC.
 *
 * Une fois l'an, le 1er janvier : la source est publiée à ce rythme, et les
 * périmètres des EPCI à fiscalité propre ne bougent presque plus depuis la fin
 * de l'application de la loi NOTRe. Ce passage sert surtout les créations, les
 * fusions de communes et les sièges qui déménagent.
 *
 * Le déploiement du change sqitch a déjà rempli la table : rien n'attend cette
 * échéance pour exister. Et rien ne dépend d'elle non plus — la mutation reste
 * appelable à la main depuis Bull Board si un millésime paraît en cours d'année.
 */
@Injectable()
export class CronImportPerimetresEpciService {
  private readonly trpcClient = this.trpcClientService.getClient();

  constructor(private readonly trpcClientService: TrpcClientService) {}

  importPerimetresEpci() {
    return this.trpcClient.collectivites.perimetres.importPerimetresEpci.mutate(
      {}
    );
  }
}
