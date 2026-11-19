import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { and, eq, inArray } from 'drizzle-orm';
import {
  demarchePcaetExportTable,
  type DemarchePcaetExportRow,
  type DemarchePcaetExportTransition,
  type DemarchePcaetExportType,
} from '../shared/models/demarche-pcaet-export.table';

@Injectable()
export class DemarchePcaetExportRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Parmi `paths`, ceux qu'une ligne commitée désigne encore. Hors de toute
   * transaction : c'est l'état réellement validé qui compte, pas celui de la
   * transaction qui vient d'échouer.
   */
  async listReferencedStoragePaths(paths: string[]): Promise<string[]> {
    if (paths.length === 0) {
      return [];
    }
    const rows = await this.databaseService.db
      .select({ storagePath: demarchePcaetExportTable.storagePath })
      .from(demarchePcaetExportTable)
      .where(inArray(demarchePcaetExportTable.storagePath, paths));
    return rows.map(({ storagePath }) => storagePath);
  }

  /** Tous les exports figés d'un dépôt, toutes transitions confondues. */
  async listByDemarcheId(
    demarcheId: number,
    tx?: Transaction
  ): Promise<DemarchePcaetExportRow[]> {
    return (tx ?? this.databaseService.db)
      .select()
      .from(demarchePcaetExportTable)
      .where(eq(demarchePcaetExportTable.demarcheId, demarcheId));
  }

  /**
   * Remplace les lignes d'une transition par celles des classeurs produits :
   * un type qui n'est plus produit (`plan_expurge` quand la fiche restreinte a
   * été rendue visible entre deux essais) ne laisse pas de ligne derrière lui.
   */
  async replaceForTransition(
    {
      demarcheId,
      transition,
      exports,
      userId,
    }: {
      demarcheId: number;
      transition: DemarchePcaetExportTransition;
      exports: {
        type: DemarchePcaetExportType;
        storagePath: string;
        filename: string;
      }[];
      userId: string;
    },
    tx: Transaction
  ): Promise<void> {
    await tx
      .delete(demarchePcaetExportTable)
      .where(
        and(
          eq(demarchePcaetExportTable.demarcheId, demarcheId),
          eq(demarchePcaetExportTable.transition, transition)
        )
      );
    if (exports.length === 0) {
      return;
    }
    await tx.insert(demarchePcaetExportTable).values(
      exports.map((row) => ({
        ...row,
        demarcheId,
        transition,
        createdBy: userId,
      }))
    );
  }
}
