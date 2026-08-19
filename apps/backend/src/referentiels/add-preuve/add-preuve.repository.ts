import { Injectable, Logger } from '@nestjs/common';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { preuveActionTable } from '@tet/backend/collectivites/documents/models/preuve-action.table';
import { preuveComplementaireTable } from '@tet/backend/collectivites/documents/models/preuve-complementaire.table';
import { preuveReglementaireTable } from '@tet/backend/collectivites/documents/models/preuve-reglementaire.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { isErrorWithCause } from '@tet/backend/utils/nest/errors.utils';
import { PgIntegrityConstraintViolation } from '@tet/backend/utils/postgresql-error-codes.enum';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { CommonError, CommonErrorEnum } from '@tet/backend/utils/trpc/common-errors';
import { getErrorMessage } from '@tet/domain/utils';
import { eq } from 'drizzle-orm';
import type {
    AddPreuveComplementaireWithFileInput,
    AddPreuveComplementaireWithLinkInput,
    AddPreuveReglementaireWithFileInput,
    AddPreuveReglementaireWithLinkInput,
} from './add-preuve.input';
import type { AddPreuveOutput } from './add-preuve.output';

type AddPreuveCommonParams = {
  collectiviteId: number;
  commentaire: string;
  modifiedBy: string;
};

type AddPreuveReglementaireWithFileParams = AddPreuveCommonParams &
  AddPreuveReglementaireWithFileInput;
type AddPreuveReglementaireWithLinkParams = AddPreuveCommonParams &
  AddPreuveReglementaireWithLinkInput;
type AddPreuveComplementaireWithFileParams = AddPreuveCommonParams &
  AddPreuveComplementaireWithFileInput;
type AddPreuveComplementaireWithLinkParams = AddPreuveCommonParams &
  AddPreuveComplementaireWithLinkInput;

@Injectable()
export class AddPreuveRepository {
  private readonly logger = new Logger(AddPreuveRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async getFichierCollectiviteId(fichierId: number): Promise<number | null> {
    const [row] = await this.databaseService.db
      .select({ collectiviteId: bibliothequeFichierTable.collectiviteId })
      .from(bibliothequeFichierTable)
      .where(eq(bibliothequeFichierTable.id, fichierId));

    return row?.collectiviteId ?? null;
  }

  async getActionIdByPreuveReglementaireId(
    preuveId: string
  ): Promise<string | null> {
    const [row] = await this.databaseService.db
      .select({ actionId: preuveActionTable.actionId })
      .from(preuveActionTable)
      .where(eq(preuveActionTable.preuveId, preuveId))
      .limit(1);

    return row?.actionId ?? null;
  }

  async addPreuveReglementaireWithFile(
    params: AddPreuveReglementaireWithFileParams,
    tx?: Transaction
  ): Promise<Result<AddPreuveOutput, CommonError>> {
    const { collectiviteId, preuveId, fichierId, commentaire, modifiedBy } =
      params;
    const db = tx ?? this.databaseService.db;

    try {
      const [inserted] = await db
        .insert(preuveReglementaireTable)
        .values({
          collectiviteId,
          preuveId,
          fichierId,
          commentaire,
          modifiedBy,
          url: null,
          titre: '',
        })
        .returning({ id: preuveReglementaireTable.id });

      return inserted
        ? success(inserted)
        : failure(CommonErrorEnum.DATABASE_ERROR);
    } catch (error) {
      return this.handleInsertError(
        error,
        `Erreur lors de la création d'une preuve réglementaire (fichier) pour ${preuveId}`
      );
    }
  }

  async addPreuveReglementaireWithLink(
    params: AddPreuveReglementaireWithLinkParams,
    tx?: Transaction
  ): Promise<Result<AddPreuveOutput, CommonError>> {
    const { collectiviteId, preuveId, lien, commentaire, modifiedBy } = params;
    const db = tx ?? this.databaseService.db;

    try {
      const [inserted] = await db
        .insert(preuveReglementaireTable)
        .values({
          collectiviteId,
          preuveId,
          commentaire,
          modifiedBy,
          fichierId: null,
          url: lien.url,
          titre: lien.titre,
        })
        .returning({ id: preuveReglementaireTable.id });

      return inserted
        ? success(inserted)
        : failure(CommonErrorEnum.DATABASE_ERROR);
    } catch (error) {
      return this.handleInsertError(
        error,
        `Erreur lors de la création d'une preuve réglementaire (lien) pour ${preuveId}`
      );
    }
  }

  async addPreuveComplementaireWithFile(
    params: AddPreuveComplementaireWithFileParams,
    tx?: Transaction
  ): Promise<Result<AddPreuveOutput, CommonError>> {
    const { collectiviteId, actionId, fichierId, commentaire, modifiedBy } =
      params;
    const db = tx ?? this.databaseService.db;

    try {
      const [inserted] = await db
        .insert(preuveComplementaireTable)
        .values({
          collectiviteId,
          actionId,
          fichierId,
          commentaire,
          modifiedBy,
          url: null,
          titre: '',
        })
        .returning({ id: preuveComplementaireTable.id });

      return inserted
        ? success(inserted)
        : failure(CommonErrorEnum.DATABASE_ERROR);
    } catch (error) {
      return this.handleInsertError(
        error,
        `Erreur lors de la création d'une preuve complémentaire (fichier) pour ${actionId}`
      );
    }
  }

  async addPreuveComplementaireWithLink(
    params: AddPreuveComplementaireWithLinkParams,
    tx?: Transaction
  ): Promise<Result<AddPreuveOutput, CommonError>> {
    const { collectiviteId, actionId, lien, commentaire, modifiedBy } = params;
    const db = tx ?? this.databaseService.db;

    try {
      const [inserted] = await db
        .insert(preuveComplementaireTable)
        .values({
          collectiviteId,
          actionId,
          commentaire,
          modifiedBy,
          fichierId: null,
          url: lien.url,
          titre: lien.titre,
        })
        .returning({ id: preuveComplementaireTable.id });

      return inserted
        ? success(inserted)
        : failure(CommonErrorEnum.DATABASE_ERROR);
    } catch (error) {
      return this.handleInsertError(
        error,
        `Erreur lors de la création d'une preuve complémentaire (lien) pour ${actionId}`
      );
    }
  }

  private handleInsertError(
    error: unknown,
    message: string
  ): Result<AddPreuveOutput, CommonError> {
    if (
      isErrorWithCause(error) &&
      error.cause.code ===
        PgIntegrityConstraintViolation.ForeignKeyViolation &&
      (error.cause.constraint === 'preuve_complementaire_action_id_fkey' ||
        error.cause.constraint === 'preuve_reglementaire_preuve_id_fkey')
    ) {
      this.logger.warn(message);
      return failure(CommonErrorEnum.NOT_FOUND);
    }

    this.logger.error(`${message}: ${getErrorMessage(error)}`);
    return failure(
      CommonErrorEnum.DATABASE_ERROR,
      error instanceof Error ? error : new Error(getErrorMessage(error))
    );
  }
}