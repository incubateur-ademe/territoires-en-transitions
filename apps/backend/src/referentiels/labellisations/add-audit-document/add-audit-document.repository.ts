import { Injectable, Logger } from '@nestjs/common';
import { preuveAuditTable } from '@tet/backend/collectivites/documents/models/preuve-audit.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { PreuveAudit } from '@tet/domain/collectivites';
import { getErrorMessage } from '@tet/domain/utils';
import type { InferSelectModel } from 'drizzle-orm';
import {
  AddAuditDocumentError,
  AddAuditDocumentErrorEnum,
} from './add-audit-document.errors';

type PreuveAuditRow = InferSelectModel<typeof preuveAuditTable>;

type AddAuditDocumentParams = {
  auditId: number;
  fichierId: number;
  collectiviteId: number;
  modifiedBy: string;
};

@Injectable()
export class AddAuditDocumentRepository {
  private readonly logger = new Logger(AddAuditDocumentRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async addAuditDocument(
    params: AddAuditDocumentParams,
    tx?: Transaction
  ): Promise<Result<PreuveAudit, AddAuditDocumentError>> {
    const { auditId, fichierId, collectiviteId, modifiedBy } = params;

    try {
      const [inserted] = await (tx ?? this.databaseService.db)
        .insert(preuveAuditTable)
        .values({
          collectiviteId,
          auditId,
          fichierId,
          modifiedBy,
        })
        .returning();

      if (!inserted) {
        return failure(AddAuditDocumentErrorEnum.DATABASE_ERROR);
      }

      return success(this.rowToPreuveAudit(inserted));
    } catch (error) {
      this.logger.error(
        `Failed to add a document to audit ${auditId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(
        AddAuditDocumentErrorEnum.DATABASE_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }

  private rowToPreuveAudit(row: PreuveAuditRow): PreuveAudit {
    return {
      ...row,
      modifiedAt: new Date(row.modifiedAt).toISOString(),
    };
  }
}
