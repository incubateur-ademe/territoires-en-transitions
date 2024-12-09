import { DatabaseService } from '@/backend/utils';
import { Injectable, Logger } from '@nestjs/common';
import { annexeTable } from '../models/documents/annexe.table';
import { LienType } from '../models/documents/document-lien.dto';

@Injectable()
export default class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Crée une annexe de type lien // TODO refaire pour inclure les documents
   * @param ficheId identifiant de la fiche
   * @param lien label et url du lien
   * @param collectiviteId identifiant de la collectivité concernée
   * @return identifiant de la fiche crée
   */
  async createLienAnnexe(
    ficheId: number,
    lien: LienType,
    collectiviteId: number
  ): Promise<number> {
    this.logger.log(
      `Création de l'annexe ${lien.label} pour la collectivité ${collectiviteId}`
    );
    const annexeCree = await this.databaseService.db
      .insert(annexeTable)
      .values({
        collectiviteId: collectiviteId,
        url: lien.url,
        titre: lien.label,
        ficheId: ficheId,
      })
      .returning();
    return annexeCree[0]?.id;
  }
}
