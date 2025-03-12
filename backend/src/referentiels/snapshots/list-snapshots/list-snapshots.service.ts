import { DatabaseService } from '@/backend/utils';
import { ReferentielId, referentielIdEnumSchema } from '@/domain/referentiels';
import { roundTo } from '@/domain/utils';
import { Injectable } from '@nestjs/common';
import { and, asc, eq, inArray } from 'drizzle-orm';
import z from 'zod';
import {
  SnapshotJalon,
  SnapshotJalonEnum,
  snapshotJalonEnumSchema,
} from '../snapshot-jalon.enum';
import { Snapshot, snapshotTable } from '../snapshot.table';

const DEFAULT_JALONS = [
  SnapshotJalonEnum.PRE_AUDIT,
  SnapshotJalonEnum.POST_AUDIT,
  SnapshotJalonEnum.DATE_PERSONNALISEE,
  SnapshotJalonEnum.COURANT,
  SnapshotJalonEnum.VISITE_ANNUELLE,
];

export const listInputSchema = z.object({
  referentielId: referentielIdEnumSchema,
  collectiviteId: z.number().int(),
  options: z
    .object({
      jalons: snapshotJalonEnumSchema
        .array()
        .optional()
        .default(DEFAULT_JALONS),
    })
    .optional()
    .default({
      jalons: DEFAULT_JALONS,
    }),
});

type ListInput = z.output<typeof listInputSchema>;

type ListOutput = {
  collectiviteId: number;
  referentielId: ReferentielId;
  typesJalon: SnapshotJalon[];
  snapshots: Array<
    Omit<Snapshot, 'scoresPayload' | 'personnalisationReponses'>
  >;
};

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
      .orderBy(asc(snapshotTable.date));

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
      date: snapshotTable.date,
      jalon: snapshotTable.jalon,
      pointFait: snapshotTable.pointFait,
      pointProgramme: snapshotTable.pointProgramme,
      pointPasFait: snapshotTable.pointPasFait,
      pointPotentiel: snapshotTable.pointPotentiel,
      referentielVersion: snapshotTable.referentielVersion,
      auditId: snapshotTable.auditId,
      createdAt: snapshotTable.createdAt,
      createdBy: snapshotTable.createdBy,
      modifiedAt: snapshotTable.modifiedAt,
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
      typesJalon: jalons ?? [],
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
