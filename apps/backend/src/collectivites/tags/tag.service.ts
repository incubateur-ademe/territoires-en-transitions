import { categorieTagTable } from '@/backend/collectivites/tags/categorie-tag.table';
import { financeurTagTable } from '@/backend/collectivites/tags/financeur-tag.table';
import { libreTagTable } from '@/backend/collectivites/tags/libre-tag.table';
import { partenaireTagTable } from '@/backend/collectivites/tags/partenaire-tag.table';
import { personneTagTable } from '@/backend/collectivites/tags/personnes/personne-tag.table';
import { serviceTagTable } from '@/backend/collectivites/tags/service-tag.table';
import { structureTagTable } from '@/backend/collectivites/tags/structure-tag.table';
import {
  TagEnum,
  TagInsert,
  TagType,
  TagWithCollectiviteId,
} from '@/backend/collectivites/tags/tag.table-base';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Injectable } from '@nestjs/common';
import { and, AnyColumn, eq } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';

const tagTypeTable: Record<TagType, PgTable & { collectiviteId: AnyColumn }> = {
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
    tag: TagInsert,
    tagType: TagType,
    tx?: Transaction
  ): Promise<TagWithCollectiviteId> {
    const table = tagTypeTable[tagType];

    const [result] = await (tx ?? this.databaseService.db)
      .insert(table)
      .values({ nom: tag.nom, collectiviteId: tag.collectiviteId })
      .onConflictDoNothing()
      .returning();

    if (!result) {
      // happens when the tag already exists and the onConflictDoNothing is used
      const existingTag = await (tx ?? this.databaseService.db)
        .select()
        .from(tagTypeTable[tagType])
        .where(
          and(
            eq((table as any).nom, tag.nom),
            eq((table as any).collectiviteId, tag.collectiviteId)
          )
        )
        .limit(1);
      return existingTag[0] as TagWithCollectiviteId;
    }

    return {
      nom: result.nom as string,
      collectiviteId: result.collectiviteId as number,
      id: result.id as number,
    };
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
