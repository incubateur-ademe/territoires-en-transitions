import { Injectable, Logger } from '@nestjs/common';
import DatabaseService from '../../common/services/database.service';
import { and, eq, isNull, or } from 'drizzle-orm';
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
   * Retourne l'identifiant d'un axe s'il existe déjà ou le crée
   * Un axe existe déjà si : même nom, même collectivité, et même axe parent
   * @param axe
   * @return identifiant de l'axe récupéré ou créé
   */
  async createOrReturnAxeId(axe: CreateAxeType): Promise<number> {
    const axeExistants = await this.databaseService.db
      .select()
      .from(axeTable)
      .where(
        and(
          eq(axeTable.nom, axe.nom.trim()),
          eq(axeTable.collectiviteId, axe.collectiviteId),
          or(
            and(
              isNull(axeTable.parent),
              isNull(axe.parent ? axe.parent : null)
            ),
            eq(axeTable.parent, axe.parent)
          )
        )
      );
    const axeExistant = axeExistants?.length > 0 ? axeExistants[0] : null;
    if (!axeExistant) {
      return await this.createAxe(axe);
    }
    return axeExistant.id;
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
