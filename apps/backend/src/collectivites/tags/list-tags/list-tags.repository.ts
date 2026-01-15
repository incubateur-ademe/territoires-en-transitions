import { Injectable, Logger } from '@nestjs/common';
import { categorieTagTable } from '@tet/backend/collectivites/tags/categorie-tag.table';
import { financeurTagTable } from '@tet/backend/collectivites/tags/financeur-tag.table';
import { libreTagTable } from '@tet/backend/collectivites/tags/libre-tag.table';
import { partenaireTagTable } from '@tet/backend/collectivites/tags/partenaire-tag.table';
import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { serviceTagTable } from '@tet/backend/collectivites/tags/service-tag.table';
import { structureTagTable } from '@tet/backend/collectivites/tags/structure-tag.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { TagEnum, TagType, TagWithCollectiviteId } from '@tet/domain/collectivites';
import { AnyColumn, eq, inArray, asc } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import { ListTagsError, ListTagsErrorEnum } from './list-tags.errors';
import { ListTagsInput } from './list-tags.input';
import { ListTagsOutput } from './list-tags.output';
import { Result } from '@tet/backend/utils/result.type';

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
export class ListTagsRepository {
  private readonly logger = new Logger(ListTagsRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async listTags(
    input: ListTagsInput,
    tx?: Transaction
  ): Promise<Result<ListTagsOutput, ListTagsError>> {
    try {
      const table = tagTypeTable[input.tagType];
      const db = tx ?? this.databaseService.db;

      let tags;
      if (input.collectiviteIds && input.collectiviteIds.length > 0) {
        // Support multiple collectivites
        tags = await db
          .select()
          .from(table)
          .where(inArray(table.collectiviteId, input.collectiviteIds))
          .orderBy(asc(table.nom));
      } else if (input.collectiviteId) {
        // Single collectivite
        tags = await db
          .select()
          .from(table)
          .where(eq(table.collectiviteId, input.collectiviteId))
          .orderBy(asc(table.nom));
      } else {
        return {
          success: false,
          error: ListTagsErrorEnum.LIST_TAGS_ERROR,
        };
      }

      const output: TagWithCollectiviteId[] = tags.map((tag) => ({
        id: tag.id as number,
        nom: tag.nom as string,
        collectiviteId: tag.collectiviteId as number,
      }));

      return {
        success: true,
        data: output,
      };
    } catch (error) {
      this.logger.error('Error listing tags', error);
      return {
        success: false,
        error: ListTagsErrorEnum.LIST_TAGS_ERROR,
        cause: error as Error,
      };
    }
  }
}
