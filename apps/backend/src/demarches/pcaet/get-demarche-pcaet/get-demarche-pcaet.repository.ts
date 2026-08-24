import { Injectable, Logger } from '@nestjs/common';
import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { createdByNom, dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import type { PersonneTagOrUser } from '@tet/domain/collectivites';
import { DemarcheTypeEnum, type DemarchePcaet } from '@tet/domain/demarches';
import { and, eq, inArray, sql } from 'drizzle-orm';
import {
  demarchePcaetSelectColumns,
  toDemarchePcaetDto,
} from '../shared/models/demarche-pcaet.dto';
import { DemarchePlanActionsRepository } from '@tet/backend/demarches/shared/demarche-plan-actions.repository';
import { demarchePiloteTable } from '@tet/backend/demarches/shared/models/demarche-pilote.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import {
  GetDemarchePcaetError,
  GetDemarchePcaetErrorEnum,
} from './get-demarche-pcaet.errors';

@Injectable()
export class GetDemarchePcaetRepository {
  private readonly logger = new Logger(GetDemarchePcaetRepository.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly planActionsRepository: DemarchePlanActionsRepository
  ) {}

  async getDemarchePcaet(
    {
      demarcheId,
      collectiviteId,
    }: { demarcheId: number; collectiviteId: number },
    tx?: Transaction
  ): Promise<Result<DemarchePcaet, GetDemarchePcaetError>> {
    const db = tx || this.databaseService.db;
    try {
      const rows = await db
        .select(demarchePcaetSelectColumns)
        .from(demarcheTable)
        .where(
          and(
            eq(demarcheTable.id, demarcheId),
            eq(demarcheTable.collectiviteId, collectiviteId),
            eq(demarcheTable.type, DemarcheTypeEnum.PCAET)
          )
        )
        .limit(1);

      if (rows.length === 0) {
        return failure(GetDemarchePcaetErrorEnum.DEMARCHE_PCAET_NOT_FOUND);
      }

      const [pilotesByDemarcheId, planActionIds] = await Promise.all([
        this.listPilotes([demarcheId], tx),
        this.planActionsRepository.listPlanActionIds(demarcheId, tx),
      ]);
      return success(
        toDemarchePcaetDto(
          rows[0],
          pilotesByDemarcheId.get(demarcheId) ?? [],
          planActionIds
        )
      );
    } catch (error) {
      this.logger.error(`Error getting demarche PCAET ${demarcheId}: ${error}`);
      return failure(GetDemarchePcaetErrorEnum.DATABASE_ERROR);
    }
  }

  /** Pilotes des démarches, avec le nom résolu depuis personne_tag ou dcp. */
  async listPilotes(
    demarcheIds: number[],
    tx?: Transaction
  ): Promise<Map<number, PersonneTagOrUser[]>> {
    const db = tx || this.databaseService.db;
    const pilotesByDemarcheId = new Map<number, PersonneTagOrUser[]>();
    if (demarcheIds.length === 0) {
      return pilotesByDemarcheId;
    }

    const rows = await db
      .select({
        demarcheId: demarchePiloteTable.demarcheId,
        tagId: demarchePiloteTable.tagId,
        userId: demarchePiloteTable.userId,
        // Même résolution que les autres listes de pilotes du produit
        // (comptes supprimés/désactivés masqués par createdByNom).
        nom: sql<string>`CASE WHEN ${demarchePiloteTable.tagId} IS NOT NULL THEN ${personneTagTable.nom} ELSE ${createdByNom} END`,
      })
      .from(demarchePiloteTable)
      .leftJoin(
        personneTagTable,
        eq(demarchePiloteTable.tagId, personneTagTable.id)
      )
      .leftJoin(dcpTable, eq(demarchePiloteTable.userId, dcpTable.id))
      .where(inArray(demarchePiloteTable.demarcheId, demarcheIds));

    for (const row of rows) {
      const pilotes = pilotesByDemarcheId.get(row.demarcheId) ?? [];
      pilotes.push({
        nom: row.nom ?? '',
        tagId: row.tagId,
        userId: row.userId,
      });
      pilotesByDemarcheId.set(row.demarcheId, pilotes);
    }
    return pilotesByDemarcheId;
  }
}
