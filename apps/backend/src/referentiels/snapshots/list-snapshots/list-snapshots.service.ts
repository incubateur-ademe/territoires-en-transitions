import { Injectable } from '@nestjs/common';
import {
  CollectiviteReferentielModeService,
  isCollectiviteReferentielDisplayId,
} from '@tet/backend/collectivites/collectivite-referentiel-mode/collectivite-referentiel-mode.service';
import { LIST_DEFAULT_JALONS } from '@tet/backend/referentiels/snapshots/list-snapshots/list-snapshots.api-query';
import { sqlToDate, sqlToDateTimeISO } from '@tet/backend/utils/column.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import {
  referentielIdEnumSchema,
  ScoreSnapshot,
  SnapshotJalonEnum,
  snapshotJalonEnumSchema,
} from '@tet/domain/referentiels';
import { roundTo } from '@tet/domain/utils';
import { and, desc, eq, inArray } from 'drizzle-orm';
import z from 'zod';
import { snapshotTable } from '../snapshot.table';

export const listInputSchema = z.object({
  referentielId: referentielIdEnumSchema,
  collectiviteId: z.number().int(),
  options: z
    .object({
      jalons: snapshotJalonEnumSchema
        .array()
        .optional()
        .default(LIST_DEFAULT_JALONS),
    })
    .optional()
    .default({
      jalons: LIST_DEFAULT_JALONS,
    }),
});

type ListInput = z.output<typeof listInputSchema>;

@Injectable()
export class ListSnapshotsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly collectiviteReferentielModeService: CollectiviteReferentielModeService
  ) {}
  private readonly db = this.databaseService.db;

  async listWithScores({
    collectiviteId,
    referentielId,
    options: { jalons },
  }: ListInput): Promise<ScoreSnapshot[]> {
    const effectiveJalons = await this.getEffectiveJalons(
      collectiviteId,
      referentielId,
      jalons
    );
    const filters = [
      eq(snapshotTable.collectiviteId, collectiviteId),
      eq(snapshotTable.referentielId, referentielId),
    ];

    if (effectiveJalons) {
      filters.push(inArray(snapshotTable.jalon, effectiveJalons));
    }

    const snapshots = await this.databaseService.db
      .select()
      .from(snapshotTable)
      .where(and(...filters))
      .orderBy(desc(snapshotTable.date));

    return snapshots as ScoreSnapshot[];
  }

  async list({
    collectiviteId,
    referentielId,
    options: { jalons },
  }: ListInput & {
    additionalSelectColumns?: Parameters<DatabaseService['db']['select']>[0];
  }) {
    const effectiveJalons = await this.getEffectiveJalons(
      collectiviteId,
      referentielId,
      jalons
    );
    const filters = [
      eq(snapshotTable.collectiviteId, collectiviteId),
      eq(snapshotTable.referentielId, referentielId),
    ];

    if (effectiveJalons) {
      filters.push(inArray(snapshotTable.jalon, effectiveJalons));
    }

    // Dynamically build the selection based on withScores flag
    const columns = {
      ref: snapshotTable.ref,
      nom: snapshotTable.nom,
      date: sqlToDate(snapshotTable.date),
      jalon: snapshotTable.jalon,
      pointFait: snapshotTable.pointFait,
      pointProgramme: snapshotTable.pointProgramme,
      pointPasFait: snapshotTable.pointPasFait,
      pointPotentiel: snapshotTable.pointPotentiel,
      referentielVersion: snapshotTable.referentielVersion,
      auditId: snapshotTable.auditId,
      createdAt: sqlToDateTimeISO(snapshotTable.createdAt),
      createdBy: snapshotTable.createdBy,
      modifiedAt: sqlToDateTimeISO(snapshotTable.modifiedAt),
      modifiedBy: snapshotTable.modifiedBy,
    } as const;

    const snapshotList = await this.databaseService.db
      .select(columns)
      .from(snapshotTable)
      .where(and(...filters))
      .orderBy(desc(snapshotTable.date));

    const response = {
      collectiviteId: parseInt(collectiviteId as unknown as string),
      referentielId,
      jalons: effectiveJalons ?? [],
      snapshots: snapshotList.map((snapshot) => {
        const baseSnapshot = {
          ...snapshot,
          pointNonRenseigne:
            roundTo(
              snapshot.pointPotentiel -
                (snapshot.pointFait +
                  snapshot.pointPasFait +
                  snapshot.pointProgramme),
              2
            ) || undefined,
        };

        return baseSnapshot;
      }),
    };

    return response;
  }

  private async getEffectiveJalons(
    collectiviteId: number,
    referentielId: ListInput['referentielId'],
    jalons: ListInput['options']['jalons']
  ) {
    if (!isCollectiviteReferentielDisplayId(referentielId)) {
      return jalons;
    }

    const referentielModeResult =
      await this.collectiviteReferentielModeService.getReferentielMode(
        collectiviteId,
        referentielId
      );

    if (!referentielModeResult.success) {
      return jalons;
    }

    if (referentielModeResult.data !== 'archived') {
      return jalons;
    }

    return jalons.filter((jalon) => jalon !== SnapshotJalonEnum.COURANT);
  }
}
