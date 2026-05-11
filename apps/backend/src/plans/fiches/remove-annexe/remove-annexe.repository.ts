import { Injectable, Logger } from '@nestjs/common';
import { annexeTable } from '@tet/backend/collectivites/documents/models/annexe.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { CommonErrorEnum } from '@tet/backend/utils/trpc/common-errors';
import { getErrorMessage } from '@tet/domain/utils';
import type { InferSelectModel } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { RemoveAnnexeError } from './remove-annexe.errors';

type AnnexeRow = InferSelectModel<typeof annexeTable>;

@Injectable()
export class RemoveAnnexeRepository {
  private readonly logger = new Logger(RemoveAnnexeRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async findById(annexeId: number): Promise<AnnexeRow | undefined> {
    const [row] = await this.databaseService.db
      .select()
      .from(annexeTable)
      .where(eq(annexeTable.id, annexeId))
      .limit(1);
    return row;
  }

  async deleteById(annexeId: number): Promise<Result<{ id: number }, RemoveAnnexeError>> {
    try {
      const [deleted] = await this.databaseService.db
        .delete(annexeTable)
        .where(eq(annexeTable.id, annexeId))
        .returning({ id: annexeTable.id });

      if (!deleted) {
        return failure(CommonErrorEnum.NOT_FOUND);
      }

      return success(deleted);
    } catch (error) {
      this.logger.error(
        `Erreur lors de la suppression de l'annexe ${annexeId}: ${getErrorMessage(error)}`
      );
      return failure(
        CommonErrorEnum.DATABASE_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }
}
