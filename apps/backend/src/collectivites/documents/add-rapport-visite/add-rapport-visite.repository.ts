import { Injectable, Logger } from '@nestjs/common';
import { preuveRapportTable } from '@tet/backend/collectivites/documents/models/preuve-rapport.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  CommonError,
  CommonErrorEnum,
} from '@tet/backend/utils/trpc/common-errors';
import { PreuveRapport } from '@tet/domain/collectivites';
import { getErrorMessage } from '@tet/domain/utils';
import { InferSelectModel } from 'drizzle-orm';
import type {
  AddRapportVisiteWithFichierInput,
  AddRapportVisiteWithLienInput,
} from './add-rapport-visite.input';

type PreuveRapportRow = InferSelectModel<typeof preuveRapportTable>;

type AddRapportVisiteCommonParams = {
  commentaire: string;
  modifiedBy: string;
};

type AddRapportVisiteWithFichierParams = AddRapportVisiteCommonParams &
  AddRapportVisiteWithFichierInput;
type AddRapportVisiteWithLienParams = AddRapportVisiteCommonParams &
  AddRapportVisiteWithLienInput;

const toMidnightUtc = (date: string): string => `${date}T00:00:00.000Z`;

@Injectable()
export class AddRapportVisiteRepository {
  private readonly logger = new Logger(AddRapportVisiteRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async addRapportVisiteWithFichier(
    params: AddRapportVisiteWithFichierParams,
    tx?: Transaction
  ): Promise<Result<PreuveRapport, CommonError>> {
    const { collectiviteId, date, fichierId, commentaire, modifiedBy } = params;

    try {
      const [inserted] = await (tx ?? this.databaseService.db)
        .insert(preuveRapportTable)
        .values({
          collectiviteId,
          date: toMidnightUtc(date),
          fichierId,
          commentaire,
          modifiedBy,
          url: null,
          titre: '',
        })
        .returning();

      return inserted
        ? success(this.rowToPreuveRapport(inserted))
        : failure(CommonErrorEnum.DATABASE_ERROR);
    } catch (error) {
      return this.handleInsertError(
        error,
        `Failed to insert rapport de visite (fichier) for collectivite ${collectiviteId}`
      );
    }
  }

  async addRapportVisiteWithLien(
    params: AddRapportVisiteWithLienParams,
    tx?: Transaction
  ): Promise<Result<PreuveRapport, CommonError>> {
    const { collectiviteId, date, lien, commentaire, modifiedBy } = params;

    try {
      const [inserted] = await (tx ?? this.databaseService.db)
        .insert(preuveRapportTable)
        .values({
          collectiviteId,
          date: toMidnightUtc(date),
          commentaire,
          modifiedBy,
          fichierId: null,
          url: lien.url,
          titre: lien.titre,
        })
        .returning();

      return inserted
        ? success(this.rowToPreuveRapport(inserted))
        : failure(CommonErrorEnum.DATABASE_ERROR);
    } catch (error) {
      return this.handleInsertError(
        error,
        `Failed to insert rapport de visite (lien) for collectivite ${collectiviteId}`
      );
    }
  }

  private rowToPreuveRapport(row: PreuveRapportRow): PreuveRapport {
    return {
      ...row,
      date: new Date(row.date).toISOString(),
      modifiedAt: new Date(row.modifiedAt).toISOString(),
    };
  }

  private handleInsertError(
    error: unknown,
    message: string
  ): Result<PreuveRapport, CommonError> {
    this.logger.error(`${message}: ${getErrorMessage(error)}`);
    return failure(
      CommonErrorEnum.DATABASE_ERROR,
      error instanceof Error ? error : new Error(getErrorMessage(error))
    );
  }
}
