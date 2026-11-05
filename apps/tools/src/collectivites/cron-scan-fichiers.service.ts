import { Injectable } from '@nestjs/common';

import { TrpcClientService } from '../utils/trpc/trpc-client.service';

/** Met en file un balayage antivirus des fichiers déposés, côté backend. */
@Injectable()
export class CronScanFichiersService {
  private readonly trpcClient = this.trpcClientService.getClient();

  constructor(private readonly trpcClientService: TrpcClientService) {}

  scanFichiers() {
    return this.trpcClient.collectivites.documents.scanFichiers.mutate({});
  }
}
