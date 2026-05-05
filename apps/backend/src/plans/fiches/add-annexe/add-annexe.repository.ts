import { Injectable, Logger } from '@nestjs/common';
import { annexeTable } from '@tet/backend/collectivites/documents/models/annexe.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { CommonErrorEnum } from '@tet/backend/utils/trpc/common-errors';
import { Annexe } from '@tet/domain/collectivites';
import { getErrorMessage } from '@tet/domain/utils';
import type { InferSelectModel } from 'drizzle-orm';
import { AddAnnexeError } from './add-annexe.errors';
import type {
  AddAnnexeWithFileInput,
  AddAnnexeWithLinkInput,
} from './add-annexe.input';

type AnnexeRow = InferSelectModel<typeof annexeTable>;

type AddAnnexeCommonParams = {
  collectiviteId: number;
  modifiedBy: string;
  commentaire: string;
};
export type AddAnnexeFileParams = AddAnnexeCommonParams &
  AddAnnexeWithFileInput;
export type AddAnnexeUrlParams = AddAnnexeCommonParams & AddAnnexeWithLinkInput;

@Injectable()
export class AddAnnexeRepository {
  private readonly logger = new Logger(AddAnnexeRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async addFile(
    params: AddAnnexeFileParams
  ): Promise<Result<Annexe, AddAnnexeError>> {
    const { collectiviteId, ficheId, fichierId, commentaire, modifiedBy } =
      params;

    try {
      const [inserted] = await this.databaseService.db
        .insert(annexeTable)
        .values({
          collectiviteId,
          ficheId,
          commentaire,
          modifiedBy,
          fichierId,
          url: null,
        })
        .returning();

      if (!inserted) {
        return failure(CommonErrorEnum.DATABASE_ERROR);
      }

      return success(this.rowToAnnexe(inserted));
    } catch (error) {
      this.logger.error(
        `Erreur lors de la création d'une annexe (fichier) pour la fiche ${ficheId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(
        CommonErrorEnum.DATABASE_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }

  async addUrl(
    params: AddAnnexeUrlParams
  ): Promise<Result<Annexe, AddAnnexeError>> {
    const { collectiviteId, ficheId, lien, commentaire, modifiedBy } = params;

    try {
      const [inserted] = await this.databaseService.db
        .insert(annexeTable)
        .values({
          collectiviteId,
          ficheId,
          commentaire,
          modifiedBy,
          fichierId: null,
          url: lien.url,
          titre: lien.titre,
        })
        .returning();

      if (!inserted) {
        return failure(CommonErrorEnum.DATABASE_ERROR);
      }

      return success(this.rowToAnnexe(inserted));
    } catch (error) {
      this.logger.error(
        `Erreur lors de la création d'une annexe (lien) pour la fiche ${ficheId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(
        CommonErrorEnum.DATABASE_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }

  private rowToAnnexe(row: AnnexeRow): Annexe {
    return {
      ...row,
      modifiedAt: new Date(row.modifiedAt).toISOString(),
    };
  }
}
