import { Injectable, Logger } from '@nestjs/common';
import DatabaseService from '../../common/services/database.service';
import { axeTable, CreateAxeType } from '../models/axe.table';
import { ficheActionAxeTable } from '../models/fiche-action-axe.table';

@Injectable()
export default class AxeService {
  private readonly logger = new Logger(AxeService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Crée un axe
   * @param axe
   * @return identifiant de l'axe créé
   */
  async createAxe(axe: CreateAxeType): Promise<number> {
    this.logger.log(
      `Création de l'axe ${axe.nom} pour la collectivité ${axe.collectiviteId}`
    );
    const axeCree = await this.databaseService.db
      .insert(axeTable)
      .values(axe)
      .returning();
    return axeCree[0]?.id;
  }

  /**
   * Ajoute une fiche dans un axe
   * @param ficheId identifiant de la fiche
   * @param axeId identifiant de l'axe
   */
  async addFicheAction(ficheId: number, axeId: number): Promise<void> {
    await this.databaseService.db.insert(ficheActionAxeTable).values({
      axeId: axeId,
      ficheId: ficheId,
    });
  }
}
