import { Injectable, Logger } from '@nestjs/common';
import { financeurTagTable } from '@tet/backend/collectivites/tags/financeur-tag.table';
import { libreTagTable } from '@tet/backend/collectivites/tags/libre-tag.table';
import { partenaireTagTable } from '@tet/backend/collectivites/tags/partenaire-tag.table';
import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { serviceTagTable } from '@tet/backend/collectivites/tags/service-tag.table';
import { structureTagTable } from '@tet/backend/collectivites/tags/structure-tag.table';
import { SQL_CURRENT_TIMESTAMP } from '@tet/backend/utils/column.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TagEnum, TagWithCollectiviteId } from '@tet/domain/collectivites';
import { and, eq } from 'drizzle-orm';
import { instanceGouvernanceTagTable } from '../instance-gouvernance-tag.table';
import { MutateTagError, MutateTagErrorEnum } from './mutate-tag.errors';
import {
  CreateTagInput,
  DeleteTagInput,
  UpdateTagInput,
} from './mutate-tag.input';

const tagTypeTable = {
  [TagEnum.Financeur]: financeurTagTable,
  [TagEnum.Personne]: personneTagTable,
  [TagEnum.Partenaire]: partenaireTagTable,
  [TagEnum.Service]: serviceTagTable,
  [TagEnum.Structure]: structureTagTable,
  [TagEnum.Libre]: libreTagTable,
  [TagEnum.InstanceGouvernance]: instanceGouvernanceTagTable,
};

@Injectable()
export class MutateTagRepository {
  private readonly logger = new Logger(MutateTagRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async createTag(
    {
      nom,
      collectiviteId,
      tagType,
      createdBy,
    }: CreateTagInput & { createdBy: string },
    tx?: Transaction
  ): Promise<Result<TagWithCollectiviteId, MutateTagError>> {
    try {
      const table = tagTypeTable[tagType];
      const db = tx ?? this.databaseService.db;

      const [result] = await db
        .insert(table)
        .values({
          nom,
          collectiviteId,
          createdBy,
          createdAt: SQL_CURRENT_TIMESTAMP,
        })
        .onConflictDoNothing()
        .returning();

      if (!result) {
        const [existingTag] = await db
          .select()
          .from(table)
          .where(
            and(eq(table.nom, nom), eq(table.collectiviteId, collectiviteId))
          );

        if (!existingTag) {
          return failure(MutateTagErrorEnum.TAG_CREATE_ERROR);
        }

        return success(existingTag);
      }

      return success(result);
    } catch (error) {
      this.logger.error('Error creating tag', error);
      return failure(MutateTagErrorEnum.TAG_CREATE_ERROR, error as Error);
    }
  }

  async updateTag(
    input: UpdateTagInput,
    tx?: Transaction
  ): Promise<Result<TagWithCollectiviteId, MutateTagError>> {
    try {
      const table = tagTypeTable[input.tagType];
      const db = tx ?? this.databaseService.db;
      const updateData: { nom?: string } = {};

      if (input.nom !== undefined) {
        updateData.nom = input.nom;
      }

      const [result] = await db
        .update(table)
        .set(updateData)
        .where(
          and(
            eq(table.id, input.id),
            eq(table.collectiviteId, input.collectiviteId)
          )
        )
        .returning();

      if (!result) {
        return failure(MutateTagErrorEnum.TAG_NOT_FOUND);
      }

      return success({
        id: result.id,
        nom: result.nom,
        collectiviteId: result.collectiviteId,
      });
    } catch (error) {
      this.logger.error('Error updating tag', error);
      return failure(MutateTagErrorEnum.TAG_UPDATE_ERROR, error as Error);
    }
  }

  async deleteTag(
    input: DeleteTagInput,
    tx?: Transaction
  ): Promise<Result<void, MutateTagError>> {
    try {
      const table = tagTypeTable[input.tagType];
      const db = tx ?? this.databaseService.db;

      // Data scoping guardrail: mutate only within the input collectivite.
      const result = await db
        .delete(table)
        .where(
          and(
            eq(table.id, input.id),
            eq(table.collectiviteId, input.collectiviteId)
          )
        )
        .returning({ id: table.id });

      if (result.length === 0) {
        return failure(MutateTagErrorEnum.TAG_NOT_FOUND);
      }

      return success(undefined);
    } catch (error) {
      this.logger.error('Error deleting tag', error);
      return failure(MutateTagErrorEnum.TAG_DELETE_ERROR, error as Error);
    }
  }
}
