import { Injectable, Logger } from '@nestjs/common';
import { auditTable } from '@tet/backend/referentiels/labellisations/audit.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  CommonError,
  CommonErrorEnum,
} from '@tet/backend/utils/trpc/common-errors';
import { PreuveBase, PreuveType } from '@tet/domain/collectivites';
import { LabellisationAudit, ObjetPreuve } from '@tet/domain/referentiels';
import { getErrorMessage } from '@tet/domain/utils';
import { desc, eq } from 'drizzle-orm';
import { DocumentBase } from '../models/document.basetable';
import { preuveLabellisationTable } from '../models/preuve-labellisation.table';
import { preuveComplementaireTable } from '../models/preuve-complementaire.table';
import { preuveTableByType } from '../models/preuve-tables.map';

export type PreuveDocumentPatch = {
  lien?: { url: string; titre: string };
  commentaire?: string;
} & (
  | { preuveType: 'labellisation'; objet?: ObjetPreuve | null }
  | { preuveType: Exclude<PreuveType, 'labellisation'> }
);

type PreuveLabellisationPatch = Extract<
  PreuveDocumentPatch,
  { preuveType: 'labellisation' }
>;

function isPreuveLabellisationPatch(
  patch: PreuveDocumentPatch
): patch is PreuveLabellisationPatch {
  return patch.preuveType === 'labellisation';
}

type PreuveDocumentColumns = Partial<
  Pick<DocumentBase, 'modifiedBy' | 'url' | 'titre' | 'commentaire'>
>;

type PreuveLabellisationColumns = PreuveDocumentColumns & {
  objet?: ObjetPreuve | null;
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

  async findComplementaireActionId(preuveId: number): Promise<string | null> {
    const [row] = await this.databaseService.db
      .select({ actionId: preuveComplementaireTable.actionId })
      .from(preuveComplementaireTable)
      .where(eq(preuveComplementaireTable.id, preuveId))
      .limit(1);
    return row?.actionId ?? null;
  }

  async findAuditByLabellisationPreuve(
    preuveId: number
  ): Promise<Pick<LabellisationAudit, 'valide'> | null> {
    const [row] = await this.databaseService.db
      .select({ valide: auditTable.valide })
      .from(preuveLabellisationTable)
      .innerJoin(
        auditTable,
        eq(auditTable.demandeId, preuveLabellisationTable.demandeId)
      )
      .where(eq(preuveLabellisationTable.id, preuveId))
      .orderBy(desc(auditTable.dateDebut))
      .limit(1);
    return row ?? null;
  }

  async updateById(
    preuveId: number,
    modifiedBy: string,
    patch: PreuveDocumentPatch
  ): Promise<Result<PreuveBase, CommonError>> {
    const columns: PreuveDocumentColumns = {};
    if (patch.lien !== undefined) {
      columns.modifiedBy = modifiedBy;
      columns.url = patch.lien.url.trim();
      columns.titre = patch.lien.titre.trim();
    }
    if (patch.commentaire !== undefined) {
      columns.modifiedBy = modifiedBy;
      columns.commentaire = patch.commentaire.trim();
    }
    try {
      const [row] = await this.updateRow({ preuveId, columns, patch });
      if (!row) {
        return failure(CommonErrorEnum.NOT_FOUND);
      }

      return success(this.rowToPreuveBase(row));
    } catch (error) {
      this.logger.error(
        `Erreur lors de la mise à jour de la preuve ${
          patch.preuveType
        } ${preuveId}: ${getErrorMessage(error)}`
      );
      return failure(
        CommonErrorEnum.DATABASE_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }

  private updateRow({
    preuveId,
    columns,
    patch,
  }: {
    preuveId: number;
    columns: PreuveDocumentColumns;
    patch: PreuveDocumentPatch;
  }) {
    if (isPreuveLabellisationPatch(patch)) {
      const labellisationColumns: PreuveLabellisationColumns = { ...columns };
      if (patch.objet !== undefined) {
        labellisationColumns.objet = patch.objet;
      }
      return this.databaseService.db
        .update(preuveLabellisationTable)
        .set(labellisationColumns)
        .where(eq(preuveLabellisationTable.id, preuveId))
        .returning();
    }
    const table = preuveTableByType[patch.preuveType];
    return this.databaseService.db
      .update(table)
      .set(columns)
      .where(eq(table.id, preuveId))
      .returning();
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
