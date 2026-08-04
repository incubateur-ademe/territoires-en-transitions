import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { DemarcheTypeEnum, type DemarchePcaet } from '@tet/domain/demarches';
import { and, desc, eq } from 'drizzle-orm';
import { GetDemarchePcaetRepository } from '../get-demarche-pcaet/get-demarche-pcaet.repository';
import {
  demarchePcaetSelectColumns,
  toDemarchePcaetDto,
} from '../shared/models/demarche-pcaet.dto';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import {
  ListDemarchesPcaetError,
  ListDemarchesPcaetErrorEnum,
} from './list-demarches-pcaet.errors';

@Injectable()
export class ListDemarchesPcaetRepository {
  private readonly logger = new Logger(ListDemarchesPcaetRepository.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly getDemarchePcaetRepository: GetDemarchePcaetRepository
  ) {}

  async listDemarchesPcaet(
    { collectiviteId }: { collectiviteId: number },
    tx?: Transaction
  ): Promise<Result<DemarchePcaet[], ListDemarchesPcaetError>> {
    const db = tx || this.databaseService.db;
    try {
      const rows = await db
        .select(demarchePcaetSelectColumns)
        .from(demarcheTable)
        .where(
          and(
            eq(demarcheTable.collectiviteId, collectiviteId),
            eq(demarcheTable.type, DemarcheTypeEnum.PCAET)
          )
        )
        .orderBy(desc(demarcheTable.createdAt));

      const pilotesByDemarcheId =
        await this.getDemarchePcaetRepository.listPilotes(
          rows.map((row) => row.id),
          tx
        );

      return success(
        rows.map((row) =>
          toDemarchePcaetDto(row, pilotesByDemarcheId.get(row.id) ?? [])
        )
      );
    } catch (error) {
      this.logger.error(
        `Error listing demarches PCAET for collectivite ${collectiviteId}: ${error}`
      );
      return failure(ListDemarchesPcaetErrorEnum.LIST_DEMARCHES_PCAET_ERROR);
    }
  }
}
