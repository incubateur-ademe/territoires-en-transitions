import { PermissionOperation } from '@/backend/auth/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import { ResourceType } from '@/backend/auth/authorizations/resource-type.enum';
import CollectivitesService from '@/backend/collectivites/services/collectivites.service';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, inArray, isNull, or } from 'drizzle-orm';
import { AuthenticatedUser } from '../../auth/models/auth.models';
import { groupementCollectiviteTable } from '../../collectivites/models/groupement-collectivite.table';
import DatabaseService from '../../common/services/database.service';
import { Tag } from '../../shared/models/tag.table-base';
import { categorieTagTable } from '../models/categorie-tag.table';
import { partenaireTagTable } from '../models/partenaire-tag.table';

@Injectable()
export default class TagService {
  private readonly logger = new Logger(TagService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly collectiviteService: CollectivitesService
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
  ): Promise<Tag[]> {
    // Vérifie les droits
    const collectivitePrivate = await this.collectiviteService.isPrivate(
      collectiviteId
    );
    await this.permissionService.isAllowed(
      tokenInfo,
      collectivitePrivate
        ? PermissionOperation.COLLECTIVITES_LECTURE
        : PermissionOperation.COLLECTIVITES_VISITE,
      ResourceType.COLLECTIVITE,
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
