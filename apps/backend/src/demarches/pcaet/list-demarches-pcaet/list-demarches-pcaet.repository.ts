import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  DemarcheTypeEnum,
  type DemarchePcaet,
  type DemarchePcaetStatus,
} from '@tet/domain/demarches';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { GetDemarchePcaetRepository } from '../get-demarche-pcaet/get-demarche-pcaet.repository';
import {
  demarchePcaetSelectColumns,
  toDemarchePcaetDto,
} from '../shared/models/demarche-pcaet.dto';
import { DemarchePlanActionsRepository } from '@tet/backend/demarches/shared/demarche-plan-actions.repository';
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
    private readonly getDemarchePcaetRepository: GetDemarchePcaetRepository,
    private readonly planActionsRepository: DemarchePlanActionsRepository
  ) {}

  async listDemarchesPcaet(
    {
      collectiviteId,
      statuses,
    }: {
      collectiviteId: number;
      /** Restreint la liste à ces statuts ; tous sans précision. */
      statuses?: readonly DemarchePcaetStatus[];
    },
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
            eq(demarcheTable.type, DemarcheTypeEnum.PCAET),
            statuses ? inArray(demarcheTable.status, [...statuses]) : undefined
          )
        )
        .orderBy(desc(demarcheTable.createdAt));

      const demarcheIds = rows.map((row) => row.id);
      const [
        pilotesByDemarcheId,
        planActionIdsByDemarcheId,
        unverifiedByDemarcheId,
      ] = await Promise.all([
        this.getDemarchePcaetRepository.listPilotes(demarcheIds, tx),
        this.planActionsRepository.listByDemarcheIds(demarcheIds, tx),
        this.planActionsRepository.listUnverifiedByDemarcheIds(demarcheIds, tx),
      ]);

      // Un plan n'a qu'un état de secteurs, quelle que soit la démarche qui le
      // tient : une seule lecture pour tous les plans de la liste.
      const secteursARenseignerPlanActionIds =
        await this.planActionsRepository.listSecteursARenseignerPlanActionIds(
          {
            collectiviteId,
            planActionIds: [
              ...new Set([...planActionIdsByDemarcheId.values()].flat()),
            ],
          },
          tx
        );

      return success(
        rows.map((row) => {
          const planActionIds = planActionIdsByDemarcheId.get(row.id) ?? [];
          return toDemarchePcaetDto(
            row,
            pilotesByDemarcheId.get(row.id) ?? [],
            planActionIds,
            unverifiedByDemarcheId.get(row.id) ?? [],
            secteursARenseignerPlanActionIds.filter((id) =>
              planActionIds.includes(id)
            )
          );
        })
      );
    } catch (error) {
      this.logger.error(
        `Error listing demarches PCAET for collectivite ${collectiviteId}: ${error}`
      );
      return failure(ListDemarchesPcaetErrorEnum.LIST_DEMARCHES_PCAET_ERROR);
    }
  }
}
