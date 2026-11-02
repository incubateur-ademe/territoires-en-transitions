import { Injectable } from '@nestjs/common';
import { createdByNom, dcpTable } from '@tet/backend/users/models/dcp.table';
import { sqlToDateTimeISO } from '@tet/backend/utils/column.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { desc, eq } from 'drizzle-orm';
import { pcaetDateSaisineTable } from '../shared/models/pcaet-date-saisine.table';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';
import { DateSaisine } from './list-dates-saisine.output';

@Injectable()
export class ListDatesSaisineRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async listByDemandeAvis(
    demandeAvisId: number,
    tx?: Transaction
  ): Promise<DateSaisine[]> {
    return (tx ?? this.databaseService.db)
      .select({
        dateSaisine: pcaetDateSaisineTable.dateSaisine,
        createdAt: sqlToDateTimeISO(pcaetDateSaisineTable.createdAt),
        createdByNom,
      })
      .from(pcaetDateSaisineTable)
      .innerJoin(
        pcaetDemandeAvisTable,
        eq(pcaetDemandeAvisTable.demarcheId, pcaetDateSaisineTable.demarcheId)
      )
      .leftJoin(dcpTable, eq(dcpTable.id, pcaetDateSaisineTable.createdBy))
      .where(eq(pcaetDemandeAvisTable.id, demandeAvisId))
      .orderBy(
        desc(pcaetDateSaisineTable.createdAt),
        desc(pcaetDateSaisineTable.id)
      );
  }
}
