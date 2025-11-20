import { Injectable, Logger } from '@nestjs/common';
import { ExportConnectCreate } from '@tet/domain/collectivites';
import { chunk } from 'es-toolkit';
import { SireneService } from '../sirene/sirene.service';
import { sleep } from '../utils/sleep.utils';
import { TrpcClientService } from '../utils/trpc/trpc-client.service';
import { ConnectApiService } from './connect-api.service';

@Injectable()
export class ConnectSynchroService {
  private readonly logger = new Logger(ConnectSynchroService.name);
  private readonly trpcClient = this.trpcClientService.getClient();
  private readonly CHUNK_SIZE = 10;

  constructor(
    private readonly trpcClientService: TrpcClientService,
    private readonly sireneService: SireneService,
    private readonly connectApiService: ConnectApiService
  ) {}

  /** Point d'entrée principal (à appeler à partir d'un cron) */
  async process() {
    // liste les membres à synchroniser
    let membres =
      await this.trpcClient.collectivites.membres.listExportConnect.query();
    this.logger.log(`${membres.length} membre(s) à synchroniser`);

    // liste les collectivités pour lesquelles il manque le NIC
    const listSiren: string[] = [];
    membres.forEach(({ siren, nic }) => {
      if (siren && !nic && !listSiren.includes(siren)) {
        listSiren.push(siren);
      }
    });
    this.logger.log(`${listSiren.length} NIC manquants`);

    if (listSiren.length) {
      // récupère les NIC manquants depuis l'API Sirene
      const listNic = await this.sireneService.getNIC(listSiren);

      // enregistre les NIC trouvés
      await this.trpcClient.collectivites.collectivites.updateNIC.mutate(
        listNic
      );

      // recharge la liste des membres pour avoir le NIC à jour
      membres =
        await this.trpcClient.collectivites.membres.listExportConnect.query();
    }

    // envoi chaque membre sur connect
    const membreChunks: Array<typeof membres> = chunk(membres, this.CHUNK_SIZE);
    for (const membreChunk of membreChunks) {
      await sleep(100);
      const exported: ExportConnectCreate[] = [];
      await Promise.all(
        membreChunk.map(async (membre) => {
          const isExported = await this.connectApiService.upsertContact(membre);
          if (isExported) {
            exported.push({
              userId: membre.userId,
              exportId: membre.email,
              checksum: membre.checksum,
            });
          }
        })
      );
      // et enregistre les membres exportés pour ne pas les ré-exporter si il n'y
      // a pas eu de changements
      if (exported.length) {
        this.logger.log(`Enregistre ${exported.length} membres exportés`);
        await this.trpcClient.collectivites.membres.upsertExportConnect.mutate(
          exported
        );
      }
    }
  }
}
