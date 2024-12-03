import { AuthService } from '@/backend/auth';
import { DatabaseService } from '@/backend/utils';
import { AuthenticatedUser } from '@/domain/auth';
import {
  categorieTagTable,
  groupementCollectiviteTable,
  partenaireTagTable,
  TagType,
} from '@/domain/collectivites';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, inArray, isNull, or } from 'drizzle-orm';

@Injectable()
export class TagService {
  private readonly logger = new Logger(TagService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly authService: AuthService
  ) {}

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

  /**
   * Récupère les catégories possibles pour une collectivité
   * @param collectiviteId
   * @param withPredefinedTags vrai pour inclure les tags prédéfinis par TeT
   * @param tokenInfo
   */
  async getCategoriesByCollectivite(
    collectiviteId: number,
    withPredefinedTags: boolean,
    tokenInfo: AuthenticatedUser
  ): Promise<TagType[]> {
    // Vérifie les droits
    await this.authService.verifieAccesRestreintCollectivite(
      tokenInfo,
      collectiviteId
    );

    // Sous-requête pour récupérer les groupements auquel appartient la collectivité
    const groupements = this.databaseService.db
      .selectDistinct({
        groupementId: groupementCollectiviteTable.groupementId,
      })
      .from(groupementCollectiviteTable)
      .where(eq(groupementCollectiviteTable.collectiviteId, collectiviteId));

    // Requête
    return this.databaseService.db
      .select({
        id: categorieTagTable.id,
        nom: categorieTagTable.nom,
        collectiviteId: categorieTagTable.collectiviteId,
      })
      .from(categorieTagTable)
      .where(
        withPredefinedTags
          ? // Récupère les catégories
            // - propres à la collectivité
            // - propres aux groupements de la collectivité
            // - prédéfinies visibles par TeT
            and(
              or(
                and(
                  isNull(categorieTagTable.collectiviteId),
                  isNull(categorieTagTable.groupementId)
                ),
                eq(categorieTagTable.collectiviteId, collectiviteId),
                inArray(categorieTagTable.groupementId, groupements)
              ),
              eq(categorieTagTable.visible, true)
            )
          : // Récupère seulement les catégories propres à la collectivité
            eq(categorieTagTable.collectiviteId, collectiviteId)
      );
  }
}
