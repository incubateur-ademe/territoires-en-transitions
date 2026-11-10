import { Injectable } from '@nestjs/common';

import { TrpcClientService } from '../utils/trpc/trpc-client.service';

/**
 * Photographie quotidienne du stock des démarches PCAET dans PostHog : une
 * ligne par démarche, pour suivre le stock par statut, l'âge des dossiers et
 * ce qui les retient. Le backend fait le travail, ce job ne fait que l'appeler.
 */
@Injectable()
export class CronTrackPcaetSnapshotService {
  private readonly trpcClient = this.trpcClientService.getClient();

  constructor(private readonly trpcClientService: TrpcClientService) {}

  trackSnapshot() {
    return this.trpcClient.demarches.pcaet.trackSnapshot.mutate({});
  }
}
