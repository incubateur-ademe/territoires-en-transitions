import { Injectable, Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import DatabaseService from '../../common/services/database.service';
import { partenaireTagTable } from '../models/partenaire-tag.table';

@Injectable()
export default class TagService {
  private readonly logger = new Logger(TagService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * TODO à factoriser avec les autres tags
   * Récupère l'id du tag partenaire pour une collectivité et le crée s'il n'existe pas
   * @param nom du partenaire
   * @param collectiviteId identifiant de la collectivité
   * @return identifiant du tag partenaire
   */
  async getPartenaireId(nom: string, collectiviteId: number): Promise<number> {
    let tag = null;
    if (collectiviteId) {
      const tags = await this.databaseService.db
        .select()
        .from(partenaireTagTable)
        .where(
          and(
            eq(partenaireTagTable.nom, nom.trim()),
            eq(partenaireTagTable.collectiviteId, collectiviteId)
          )
        );
      tag = tags.length > 0 ? tags[0] : null;
    }
    if (!tag) {
      const toReturn = await this.databaseService.db
        .insert(partenaireTagTable)
        .values({
          collectiviteId: collectiviteId,
          nom: nom,
        })
        .returning();
      return toReturn[0]?.id;
    }
    return tag.id;
  }
}
