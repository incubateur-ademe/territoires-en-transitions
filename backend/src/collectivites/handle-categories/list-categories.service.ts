import { PermissionOperation } from '@/backend/auth/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import { ResourceType } from '@/backend/auth/authorizations/resource-type.enum';
import CollectivitesService from '@/backend/collectivites/services/collectivites.service';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, inArray, isNull, or } from 'drizzle-orm';
import { AuthUser } from '../../auth/models/auth.models';
import { DatabaseService } from '../../utils/database/database.service';
import { categorieTagTable } from '../tags/categorie-tag.table';
import { groupementCollectiviteTable } from '../shared/models/groupement-collectivite.table';
import { Tag } from '../tags/tag.table-base';

@Injectable()
export default class ListCategoriesService {
  private readonly logger = new Logger(ListCategoriesService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly collectiviteService: CollectivitesService
  ) {}

  /**
   * Récupère les catégories possibles pour une collectivité
   * @param collectiviteId
   * @param withPredefinedTags vrai pour inclure les tags prédéfinis par TeT
   * @param tokenInfo
   */
  async listCategories(
    collectiviteId: number,
    withPredefinedTags: boolean,
    tokenInfo: AuthUser
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
