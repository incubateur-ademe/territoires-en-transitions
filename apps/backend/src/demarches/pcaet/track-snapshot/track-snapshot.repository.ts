import { Injectable } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { demarcheStatusHistoryTable } from '@tet/backend/demarches/shared/models/demarche-status-history.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { sqlToDateTimeISO } from '@tet/backend/utils/column.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { collectiviteTypeEnum } from '@tet/domain/collectivites';
import {
  DemarchePcaetStatusEnum,
  DemarcheTypeEnum,
  type DemarchePcaetObligation,
  type DemarchePcaetStatus,
} from '@tet/domain/demarches';
import { and, eq, gte, inArray, max, ne, or } from 'drizzle-orm';
import { sqlToNullableDateTimeISO } from '../shared/models/demarche-pcaet.dto';

export type DemarchePcaetSuivie = {
  id: number;
  collectiviteId: number;
  status: DemarchePcaetStatus;
  obligation: DemarchePcaetObligation;
  transmittedOffPlatform: boolean;
  isScotAec: boolean;
  createdAt: string | null;
  transmittedAt: string | null;
  avisDeadlineAt: string | null;
  publishedAt: string | null;
};

@Injectable()
export class TrackSnapshotRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Les démarches dont le stock se suit : toutes sauf les archivées, que l'on
   * garde encore le temps de voir leur archivage dans les courbes, et sauf
   * celles des collectivités de test, où le mode démo enchaîne des dossiers
   * fictifs.
   */
  async listDemarchesSuivies(
    archiveesDepuis: Date
  ): Promise<DemarchePcaetSuivie[]> {
    return this.databaseService.db
      .select({
        id: demarcheTable.id,
        collectiviteId: demarcheTable.collectiviteId,
        status: demarcheTable.status,
        obligation: demarcheTable.obligation,
        transmittedOffPlatform: demarcheTable.transmittedOffPlatform,
        isScotAec: demarcheTable.isScotAec,
        createdAt: sqlToNullableDateTimeISO(demarcheTable.createdAt),
        transmittedAt: sqlToNullableDateTimeISO(demarcheTable.transmittedAt),
        avisDeadlineAt: sqlToNullableDateTimeISO(demarcheTable.avisDeadlineAt),
        publishedAt: sqlToNullableDateTimeISO(demarcheTable.publishedAt),
      })
      .from(demarcheTable)
      .innerJoin(
        collectiviteTable,
        eq(collectiviteTable.id, demarcheTable.collectiviteId)
      )
      .where(
        and(
          eq(demarcheTable.type, DemarcheTypeEnum.PCAET),
          ne(collectiviteTable.type, collectiviteTypeEnum.TEST),
          or(
            ne(demarcheTable.status, DemarchePcaetStatusEnum.ARCHIVE),
            gte(demarcheTable.modifiedAt, archiveesDepuis.toISOString())
          )
        )
      )
      .orderBy(demarcheTable.id);
  }

  /**
   * Quand chaque démarche est entrée dans chacun de ses statuts, d'après le
   * journal : la dernière entrée l'emporte.
   */
  async listStatusEnteredAt(
    demarcheIds: number[]
  ): Promise<Map<string, string>> {
    if (demarcheIds.length === 0) return new Map();
    const rows = await this.databaseService.db
      .select({
        demarcheId: demarcheStatusHistoryTable.demarcheId,
        toStatus: demarcheStatusHistoryTable.toStatus,
        enteredAt: sqlToDateTimeISO(max(demarcheStatusHistoryTable.createdAt)),
      })
      .from(demarcheStatusHistoryTable)
      .where(inArray(demarcheStatusHistoryTable.demarcheId, demarcheIds))
      .groupBy(
        demarcheStatusHistoryTable.demarcheId,
        demarcheStatusHistoryTable.toStatus
      );
    return new Map(
      rows.map((row) => [
        statusKey(row.demarcheId, row.toStatus),
        row.enteredAt,
      ])
    );
  }
}

export const statusKey = (demarcheId: number, status: string) =>
  `${demarcheId}:${status}`;
