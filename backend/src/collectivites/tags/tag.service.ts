import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/backend/utils';
import { AnyColumn, eq } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { financeurTagTable } from '@/backend/collectivites/tags/financeur-tag.table';
import { personneTagTable } from '@/backend/collectivites/tags/personnes/personne-tag.table';
import { partenaireTagTable } from '@/backend/collectivites/tags/partenaire-tag.table';
import { serviceTagTable } from '@/backend/collectivites/tags/service-tag.table';
import { structureTagTable } from '@/backend/collectivites/tags/structure-tag.table';
import { categorieTagTable } from '@/backend/collectivites/tags/categorie-tag.table';
import { libreTagTable } from '@/backend/collectivites/tags/libre-tag.table';
import {
  Tag,
  TagEnum,
  TagInsert,
  TagType,
} from '@/backend/collectivites/tags/tag.table-base';

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
  async getTags(collectiviteId: number, tagType: TagType): Promise<Tag[]> {
    const toReturn: Tag[] = [];
    const table = tagTypeTable[tagType];

    const tags = await this.databaseService.db
      .select()
      .from(table)
      .where(eq(table.collectiviteId, collectiviteId));

    for (const tag of tags) {
      const toAdd: Tag = {
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
  ): Promise<Tag> {
    const [result] = await (tx ?? this.databaseService.db)
      .insert(tagTypeTable[tagType])
      .values({ nom: tag.nom, collectiviteId: tag.collectiviteId })
      .onConflictDoNothing()
      .returning();

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
