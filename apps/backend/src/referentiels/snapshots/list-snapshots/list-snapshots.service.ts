import { referentielIdEnumSchema } from '@/backend/referentiels/models/referentiel-id.enum';
import { LIST_DEFAULT_JALONS } from '@/backend/referentiels/snapshots/list-snapshots/list-snapshots.api-query';
import { DatabaseService } from '@/backend/utils';
import { getISOFormatDateQuery } from '@/backend/utils/column.utils';
import { roundTo } from '@/backend/utils/number.utils';
import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import z from 'zod';
import { snapshotJalonEnumSchema } from '../snapshot-jalon.enum';
import { Snapshot, snapshotTable } from '../snapshot.table';

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
  constructor(private readonly databaseService: DatabaseService) {}
  private readonly db = this.databaseService.db;

  async listWithScores({
    collectiviteId,
    referentielId,
    options: { jalons },
  }: ListInput): Promise<Snapshot[]> {
    const filters = [
      eq(snapshotTable.collectiviteId, collectiviteId),
      eq(snapshotTable.referentielId, referentielId),
    ];

    if (jalons) {
      filters.push(inArray(snapshotTable.jalon, jalons));
    }

    const snapshots = await this.databaseService.db
      .select()
      .from(snapshotTable)
      .where(and(...filters))
      .orderBy(desc(snapshotTable.date));

    return snapshots as Snapshot[];
  }

  async list({
    collectiviteId,
    referentielId,
    options: { jalons },
  }: ListInput & {
    additionalSelectColumns?: Parameters<DatabaseService['db']['select']>[0];
  }) {
    const filters = [
      eq(snapshotTable.collectiviteId, collectiviteId),
      eq(snapshotTable.referentielId, referentielId),
    ];

    if (jalons) {
      filters.push(inArray(snapshotTable.jalon, jalons));
    }

    // Dynamically build the selection based on withScores flag
    const columns = {
      ref: snapshotTable.ref,
      nom: snapshotTable.nom,
      date: getISOFormatDateQuery(snapshotTable.date),
      jalon: snapshotTable.jalon,
      pointFait: snapshotTable.pointFait,
      pointProgramme: snapshotTable.pointProgramme,
      pointPasFait: snapshotTable.pointPasFait,
      pointPotentiel: snapshotTable.pointPotentiel,
      referentielVersion: snapshotTable.referentielVersion,
      auditId: snapshotTable.auditId,
      createdAt: getISOFormatDateQuery(snapshotTable.createdAt),
      createdBy: snapshotTable.createdBy,
      modifiedAt: getISOFormatDateQuery(snapshotTable.modifiedAt),
      modifiedBy: snapshotTable.modifiedBy,
    } as const;

    const snapshotList = await this.databaseService.db
      .select(columns)
      .from(snapshotTable)
      .where(and(...filters))
      .orderBy(asc(snapshotTable.date));

    const response = {
      collectiviteId: parseInt(collectiviteId as unknown as string),
      referentielId,
      jalons: jalons ?? [],
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
}
