import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { AxeCreate } from '@tet/domain/plans';
import { DatabaseService } from '../../utils/database/database.service';
import { axeTable } from './shared/models/axe.table';

@Injectable()
export default class AxeService {
  private readonly logger = new Logger(AxeService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Crée un axe
   * @param axe
   * @param tx transaction
   * @return identifiant de l'axe créé
   */
  async createAxe(axe: AxeCreate, tx?: Transaction): Promise<number> {
    this.logger.log(
      `Création de l'axe ${axe.nom} pour la collectivité ${axe.collectiviteId}`
    );
    const axeCree = await (tx ?? this.databaseService.db)
      .insert(axeTable)
      .values(axe)
      .returning();
    return axeCree[0]?.id;
  }
}
