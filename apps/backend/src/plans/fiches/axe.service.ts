import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../utils/database/database.service';
import { axeTable, CreateAxeType } from './shared/models/axe.table';
import { ficheActionAxeTable } from './shared/models/fiche-action-axe.table';
import { Transaction } from '@/backend/utils/database/transaction.utils';

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
  async createAxe(axe: CreateAxeType, tx?: Transaction): Promise<number> {
    this.logger.log(
      `Création de l'axe ${axe.nom} pour la collectivité ${axe.collectiviteId}`
    );
    const axeCree = await (tx ?? this.databaseService.db)
      .insert(axeTable)
      .values(axe)
      .returning();
    return axeCree[0]?.id;
  }

  /**
   * Ajoute une fiche dans un axe
   * @param ficheId identifiant de la fiche
   * @param axeId identifiant de l'axe
   * @param tx transaction
   */
  async addFicheAction(
    ficheId: number,
    axeId: number,
    tx?: Transaction
  ): Promise<void> {
    await (tx ?? this.databaseService.db).insert(ficheActionAxeTable).values({
      axeId: axeId,
      ficheId: ficheId,
    });
  }
}
