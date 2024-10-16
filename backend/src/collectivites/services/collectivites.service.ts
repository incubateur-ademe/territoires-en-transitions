import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import DatabaseService from '../../common/services/database.service';
import {
  collectiviteTable,
  communeTable,
  epciTable,
} from '../models/collectivite.models';

@Injectable()
export default class CollectivitesService {
  private readonly logger = new Logger(CollectivitesService.name);

  readonly TEST_COLLECTIVITE_SIREN = '000000000';

  constructor(private readonly databaseService: DatabaseService) {}

  async getCollectivite(collectiviteId: number) {
    this.logger.log(
      `Récupération de la collectivite avec l'identifiant ${collectiviteId}`,
    );
    const collectiviteByIdResult = await this.databaseService.db
      .select()
      .from(collectiviteTable)
      .leftJoin(
        communeTable,
        eq(communeTable.collectivite_id, collectiviteTable.id),
      )
      .leftJoin(epciTable, eq(epciTable.collectivite_id, collectiviteTable.id))
      .where(eq(collectiviteTable.id, collectiviteId));
    if (!collectiviteByIdResult?.length) {
      throw new NotFoundException(
        `Commune avec l'identifiant de collectivite ${collectiviteId} introuvable`,
      );
    }

    this.logger.log(
      `Commune trouvé avec l'id ${collectiviteByIdResult[0].collectivite.id}`,
    );
    return collectiviteByIdResult[0];
  }

  async getEpciByCollectiviteId(collectiviteId: number) {
    this.logger.log(
      `Récupération de l'epci avec l'identifiant ${collectiviteId}`,
    );
    const epciByIdResult = await this.databaseService.db
      .select()
      .from(epciTable)
      .where(eq(epciTable.collectivite_id, collectiviteId));
    if (!epciByIdResult?.length) {
      throw new NotFoundException(
        `EPCI avec l'identifiant de collectivite ${collectiviteId} introuvable`,
      );
    }

    this.logger.log(`Epci trouvé avec l'id ${epciByIdResult[0].id}`);
    return epciByIdResult[0];
  }

  async getEpciBySiren(siren: string) {
    this.logger.log(`Récupération de l'epci à partir du siren ${siren}`);
    const epciBySirenResult = await this.databaseService.db
      .select()
      .from(epciTable)
      .where(eq(epciTable.siren, siren));
    if (!epciBySirenResult?.length) {
      throw new NotFoundException(`EPCI avec le siren ${siren} introuvable`);
    }
    this.logger.log(`Epci trouvé avec l'id ${epciBySirenResult[0].id}`);
    return epciBySirenResult[0];
  }
}
