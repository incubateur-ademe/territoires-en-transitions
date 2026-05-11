import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  CommonError,
  CommonErrorEnum,
} from '@tet/backend/utils/trpc/common-errors';
import { PreuveBase, PreuveType } from '@tet/domain/collectivites';
import { getErrorMessage } from '@tet/domain/utils';
import { eq } from 'drizzle-orm';
import { DocumentBase } from '../models/document.basetable';
import { preuveTableByType } from '../models/preuve-tables.map';

export type PreuveDocumentPatch = {
  lien?: { url: string; titre: string };
  commentaire?: string;
};

@Injectable()
export class EditPreuveDocumentRepository {
  private readonly logger = new Logger(EditPreuveDocumentRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async findById(
    preuveType: PreuveType,
    preuveId: number
  ): Promise<DocumentBase | undefined> {
    const table = preuveTableByType[preuveType];
    const [row] = await this.databaseService.db
      .select()
      .from(table)
      .where(eq(table.id, preuveId))
      .limit(1);
    return row;
  }

  async updateById(
    preuveType: PreuveType,
    preuveId: number,
    modifiedBy: string,
    patch: PreuveDocumentPatch
  ): Promise<Result<PreuveBase, CommonError>> {
    const set: {
      modifiedBy: string;
      url?: string | null;
      titre?: string | null;
      commentaire?: string | null;
    } = { modifiedBy };
    if (patch.lien !== undefined) {
      set.url = patch.lien.url.trim();
      set.titre = patch.lien.titre.trim();
    }
    if (patch.commentaire !== undefined) {
      set.commentaire = patch.commentaire.trim();
    }

    try {
      const table = preuveTableByType[preuveType];
      const [row] = await this.databaseService.db
        .update(table)
        .set(set)
        .where(eq(table.id, preuveId))
        .returning();
      if (!row) {
        return failure(CommonErrorEnum.NOT_FOUND);
      }

      return success(this.rowToPreuveBase(row));
    } catch (error) {
      this.logger.error(
        `Erreur lors de la mise à jour de la preuve ${preuveType} ${preuveId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(
        CommonErrorEnum.DATABASE_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }

  async deleteById(
    preuveType: PreuveType,
    preuveId: number
  ): Promise<Result<{ id: number }, CommonError>> {
    try {
      const table = preuveTableByType[preuveType];
      const [row] = await this.databaseService.db
        .delete(table)
        .where(eq(table.id, preuveId))
        .returning({ id: table.id });

      if (!row) {
        return failure(CommonErrorEnum.NOT_FOUND);
      }

      return success(row);
    } catch (error) {
      this.logger.error(
        `Erreur lors de la suppression de la preuve ${preuveType} ${preuveId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(
        CommonErrorEnum.DATABASE_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }

  private rowToPreuveBase(row: DocumentBase): PreuveBase {
    return {
      ...row,
      modifiedAt: new Date(row.modifiedAt).toISOString(),
    };
  }
}
