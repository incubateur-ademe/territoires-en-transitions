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
import { AnyColumn, eq } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import { MutateTagError, MutateTagErrorEnum } from './mutate-tag.errors';
import { CreateTagInput, DeleteTagInput, UpdateTagInput } from './mutate-tag.input';
import { Result } from '@tet/backend/utils/result.type';

const tagTypeTable: Record<TagType, PgTable & { collectiviteId: AnyColumn; id: AnyColumn; nom: AnyColumn }> = {
  [TagEnum.Financeur]: financeurTagTable,
  [TagEnum.Personne]: personneTagTable,
  [TagEnum.Partenaire]: partenaireTagTable,
  [TagEnum.Service]: serviceTagTable,
  [TagEnum.Structure]: structureTagTable,
  [TagEnum.Categorie]: categorieTagTable,
  [TagEnum.Libre]: libreTagTable,
};

@Injectable()
export class MutateTagRepository {
  private readonly logger = new Logger(MutateTagRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async createTag(
    input: CreateTagInput,
    tx?: Transaction
  ): Promise<Result<TagWithCollectiviteId, MutateTagError>> {
    try {
      const table = tagTypeTable[input.tagType];
      const db = tx ?? this.databaseService.db;

      const [result] = await db
        .insert(table)
        .values({
          nom: input.nom,
          collectiviteId: input.collectiviteId,
        })
        .returning();

      return {
        success: true,
        data: {
          id: result.id as number,
          nom: result.nom as string,
          collectiviteId: result.collectiviteId as number,
        },
      };
    } catch (error) {
      this.logger.error('Error creating tag', error);
      return {
        success: false,
        error: MutateTagErrorEnum.TAG_CREATE_ERROR,
        cause: error as Error,
      };
    }
  }

  async updateTag(
    input: UpdateTagInput,
    tx?: Transaction
  ): Promise<Result<TagWithCollectiviteId, MutateTagError>> {
    try {
      const table = tagTypeTable[input.tagType];
      const db = tx ?? this.databaseService.db;

      // Check if tag exists
      const [existing] = await db
        .select()
        .from(table)
        .where(eq(table.id, input.id));

      if (!existing) {
        return {
          success: false,
          error: MutateTagErrorEnum.TAG_NOT_FOUND,
        };
      }

      // Verify collectiviteId matches
      if (existing.collectiviteId !== input.collectiviteId) {
        return {
          success: false,
          error: MutateTagErrorEnum.UNAUTHORIZED,
        };
      }

      const updateData: { nom?: string } = {};
      if (input.nom !== undefined) {
        updateData.nom = input.nom;
      }

      const [result] = await db
        .update(table)
        .set(updateData)
        .where(eq(table.id, input.id))
        .returning();

      return {
        success: true,
        data: {
          id: result.id as number,
          nom: result.nom as string,
          collectiviteId: result.collectiviteId as number,
        },
      };
    } catch (error) {
      this.logger.error('Error updating tag', error);
      return {
        success: false,
        error: MutateTagErrorEnum.TAG_UPDATE_ERROR,
        cause: error as Error,
      };
    }
  }

  async deleteTag(
    input: DeleteTagInput,
    tx?: Transaction
  ): Promise<Result<void, MutateTagError>> {
    try {
      const table = tagTypeTable[input.tagType];
      const db = tx ?? this.databaseService.db;

      // Check if tag exists and belongs to collectivite
      const [existing] = await db
        .select()
        .from(table)
        .where(eq(table.id, input.id));

      if (!existing) {
        return {
          success: false,
          error: MutateTagErrorEnum.TAG_NOT_FOUND,
        };
      }

      // Verify collectiviteId matches
      if (existing.collectiviteId !== input.collectiviteId) {
        return {
          success: false,
          error: MutateTagErrorEnum.UNAUTHORIZED,
        };
      }

      await db.delete(table).where(eq(table.id, input.id));

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      this.logger.error('Error deleting tag', error);
      return {
        success: false,
        error: MutateTagErrorEnum.TAG_DELETE_ERROR,
        cause: error as Error,
      };
    }
  }
}
