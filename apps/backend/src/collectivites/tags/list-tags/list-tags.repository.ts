import { Injectable, Logger } from '@nestjs/common';
import { financeurTagTable } from '@tet/backend/collectivites/tags/financeur-tag.table';
import { libreTagTable } from '@tet/backend/collectivites/tags/libre-tag.table';
import { partenaireTagTable } from '@tet/backend/collectivites/tags/partenaire-tag.table';
import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { serviceTagTable } from '@tet/backend/collectivites/tags/service-tag.table';
import { structureTagTable } from '@tet/backend/collectivites/tags/structure-tag.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result } from '@tet/backend/utils/result.type';
import { TagEnum, TagWithCollectiviteId } from '@tet/domain/collectivites';
import { asc, eq } from 'drizzle-orm';
import { ListTagsError, ListTagsErrorEnum } from './list-tags.errors';
import { ListTagsInput } from './list-tags.input';

const tagTypeTable = {
  [TagEnum.Financeur]: financeurTagTable,
  [TagEnum.Personne]: personneTagTable,
  [TagEnum.Partenaire]: partenaireTagTable,
  [TagEnum.Service]: serviceTagTable,
  [TagEnum.Structure]: structureTagTable,
  [TagEnum.Libre]: libreTagTable,
};

@Injectable()
export class ListTagsRepository {
  private readonly logger = new Logger(ListTagsRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async listTags(
    { collectiviteId, tagType }: ListTagsInput,
    tx?: Transaction
  ): Promise<Result<TagWithCollectiviteId[], ListTagsError>> {
    try {
      const table = tagTypeTable[tagType];
      const db = tx ?? this.databaseService.db;

      const tags = await db
        .select({
          id: table.id,
          nom: table.nom,
          collectiviteId: table.collectiviteId,
        })
        .from(table)
        .where(eq(table.collectiviteId, collectiviteId))
        .orderBy(asc(table.nom));

      return {
        success: true,
        data: tags,
      };
    } catch (error) {
      this.logger.error(
        `ListTagsRepository.listTags: error for collectivite ${collectiviteId}, tagType ${tagType}`,
        error
      );
      return failure(ListTagsErrorEnum.LIST_TAGS_ERROR, error as Error);
    }
  }
}
