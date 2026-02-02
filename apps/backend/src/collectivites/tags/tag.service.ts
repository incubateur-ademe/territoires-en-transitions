import { Injectable } from '@nestjs/common';
import { categorieTagTable } from '@tet/backend/collectivites/tags/categorie-tag.table';
import { financeurTagTable } from '@tet/backend/collectivites/tags/financeur-tag.table';
import { libreTagTable } from '@tet/backend/collectivites/tags/libre-tag.table';
import { partenaireTagTable } from '@tet/backend/collectivites/tags/partenaire-tag.table';
import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { serviceTagTable } from '@tet/backend/collectivites/tags/service-tag.table';
import { structureTagTable } from '@tet/backend/collectivites/tags/structure-tag.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  TagCreate,
  TagEnum,
  TagType,
  TagWithCollectiviteId,
} from '@tet/domain/collectivites';
import { and, AnyColumn, eq } from 'drizzle-orm';
import { IndexColumn, PgTable } from 'drizzle-orm/pg-core';

const tagTypeTable: Record<
  TagType,
  PgTable & { collectiviteId: AnyColumn; nom: AnyColumn }
> = {
  [TagEnum.Financeur]: financeurTagTable,
  [TagEnum.Personne]: personneTagTable,
  [TagEnum.Partenaire]: partenaireTagTable,
  [TagEnum.Service]: serviceTagTable,
  [TagEnum.Structure]: structureTagTable,
  [TagEnum.Categorie]: categorieTagTable,
  [TagEnum.Libre]: libreTagTable,
};

@Injectable()
export class TagService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Permet de récupérer les tags d'un type sous un format générique {nom, id, collectiviteId}
   * @param collectiviteId
   * @param tagType
   */
  async getTags(
    collectiviteId: number,
    tagType: TagType
  ): Promise<TagWithCollectiviteId[]> {
    const toReturn: TagWithCollectiviteId[] = [];
    const table = tagTypeTable[tagType];

    const tags = await this.databaseService.db
      .select()
      .from(table)
      .where(eq(table.collectiviteId, collectiviteId));

    for (const tag of tags) {
      const toAdd: TagWithCollectiviteId = {
        nom: tag.nom as string,
        id: tag.id as number,
        collectiviteId: tag.collectiviteId as number,
      };

      toReturn.push(toAdd);
    }
    return toReturn;
  }

  /**
   * Permet de sauvegarder un tag d'un type sous un format générique {nom, id, collectiviteId}
   * @param tag
   * @param tagType
   * @param tx transaction
   */
  async saveTag(
    tag: TagCreate,
    tagType: TagType,
    tx?: Transaction
  ): Promise<Result<TagWithCollectiviteId, string>> {
    const table = tagTypeTable[tagType];

    try {
      const [result] = await (tx ?? this.databaseService.db)
        .insert(table)
        .values({ nom: tag.nom, collectiviteId: tag.collectiviteId })
        .onConflictDoNothing({
          target: [
            table.nom as IndexColumn,
            table.collectiviteId as IndexColumn,
          ],
        })
        .returning();

      if (result) {
        return success(result as TagWithCollectiviteId);
      }

      const [existingTag] = await (tx ?? this.databaseService.db)
        .select()
        .from(table)
        .where(
          and(
            eq(table.nom, tag.nom),
            eq(table.collectiviteId, tag.collectiviteId)
          )
        )
        .limit(1);

      if (!existingTag) {
        return failure(
          `Tag "${tag.nom}" not found after conflict resolution. This may indicate a database constraint issue.`
        );
      }

      return success(existingTag as TagWithCollectiviteId);
    } catch (error) {
      console.error('error', error);
      return failure(
        error instanceof Error
          ? `Database error during tag creation for "${tag.nom}": ${error.message}`
          : 'An unknown error occurred during tag creation'
      );
    }
  }

  /**
   * Permet de supprimer un tag d'un type
   * @param tagId
   * @param tagType
   */
  async deleteTag(tagId: number, tagType: TagType): Promise<void> {
    await this.databaseService.db
      .delete(tagTypeTable[tagType])
      .where(eq(serviceTagTable.id, tagId));
  }
}
