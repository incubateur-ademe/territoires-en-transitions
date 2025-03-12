import { DatabaseService } from '@/backend/utils';
import {
  ActionDefinition,
  ActionDefinitionEssential,
  referentielIdEnumSchema,
  ScoreFinalFields,
  TreeNode,
} from '@/domain/referentiels';
import { roundTo } from '@/domain/utils';
import { Injectable } from '@nestjs/common';
import { and, asc, eq, inArray } from 'drizzle-orm';
import z from 'zod';
import {
  SnapshotJalonEnum,
  snapshotJalonEnumSchema,
} from '../snapshot-jalon.enum';
import { snapshotTable } from '../snapshot.table';

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

type ListOutput = Awaited<ReturnType<ListSnapshotsService['list']>>;

type ListWithScoresOutput = ListOutput & {
  snapshots: Array<
    ListOutput['snapshots'][number] & {
      scores: TreeNode<
        Pick<ActionDefinition, 'nom' | 'identifiant' | 'categorie'> &
          ActionDefinitionEssential &
          ScoreFinalFields
      >;
    }
  >;
};

@Injectable()
export class ListSnapshotsService {
  constructor(private readonly databaseService: DatabaseService) {}
  private readonly db = this.databaseService.db;

  async listWithScores({
    collectiviteId,
    referentielId,
    options,
  }: ListInput): Promise<ListWithScoresOutput> {
    return this.list({
      collectiviteId,
      referentielId,
      options,
      additionalSelectColumns: {
        scores: snapshotTable.scoresPayload,
      } as const,
    }) as Promise<ListWithScoresOutput>;
  }

  async list({
    collectiviteId,
    referentielId,
    options: { jalons },
    additionalSelectColumns = {},
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
      ...additionalSelectColumns,
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
