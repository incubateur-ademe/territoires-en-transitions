import { Injectable } from '@nestjs/common';

import { TrpcClientService } from '../utils/trpc/trpc-client.service';

/**
 * Constate la clôture des instructions PCAET qui peuvent l'être.
 *
 * Deux chemins mènent au statut `instruit` : les avis attendus tous rendus, ou
 * le délai légal échu. Le premier se déclenche déjà à la validation du dernier
 * avis ; ce passage périodique est le seul recours du second, et rattrape le
 * premier quand la bascule n'a pas eu lieu sur le moment.
 */
@Injectable()
export class CronCloreInstructionsService {
  private readonly trpcClient = this.trpcClientService.getClient();

  constructor(private readonly trpcClientService: TrpcClientService) {}

  cloreInstructions() {
    return this.trpcClient.demarches.pcaet.cloreInstructions.mutate({});
  }
}
