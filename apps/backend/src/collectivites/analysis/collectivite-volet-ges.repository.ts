import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { LevierId } from '@tet/domain/shared';
import { getErrorMessage } from '@tet/domain/utils';
import { eq } from 'drizzle-orm';
import { uniq } from 'es-toolkit';
import {
  LevierMobilisation,
  MobilisationRepository,
  VoletMobilisation,
} from './mobilisation.repository';
import { collectiviteVoletGesTable } from './models/collectivite-volet-ges.table';
import { MobilisationState } from './models/mobilisation-state';
import { toCollectiviteVoletGesRows } from './to-collectivite-volet-ges-rows';
import { VoletErrorEnum, type VoletError } from './volet.errors';

@Injectable()
export class CollectiviteVoletGesRepository implements MobilisationRepository {
  private readonly db = this.database.db;
  private readonly logger = new Logger(CollectiviteVoletGesRepository.name);

  constructor(private readonly database: DatabaseService) {}

  async listCollectivitesWithMobilisation(): Promise<
    Result<number[], VoletError>
  > {
    try {
      const rows = await this.db
        .selectDistinct({
          collectiviteId: collectiviteVoletGesTable.collectiviteId,
        })
        .from(collectiviteVoletGesTable)
        .orderBy(collectiviteVoletGesTable.collectiviteId);

      return success(rows.map(({ collectiviteId }) => collectiviteId));
    } catch (error) {
      this.logger.error(
        `Could not list collectivites with mobilisation: ${getErrorMessage(
          error
        )}`
      );
      return failure(VoletErrorEnum.LIST_COLLECTIVITES_WITH_MOBILISATION_ERROR);
    }
  }

  async getMobilisationState({
    collectiviteId,
  }: {
    collectiviteId: number;
  }): Promise<Result<MobilisationState, VoletError>> {
    try {
      const mobilisationRows = await this.db
        .select({
          createdAt: collectiviteVoletGesTable.createdAt,
          ficheIds: collectiviteVoletGesTable.ficheIds,
        })
        .from(collectiviteVoletGesTable)
        .where(eq(collectiviteVoletGesTable.collectiviteId, collectiviteId));

      if (mobilisationRows.length === 0) {
        return success({ kind: 'never_calculated' });
      }

      const citedFicheIds = uniq(
        mobilisationRows.flatMap(({ ficheIds }) => ficheIds)
      );
      return success({
        kind: 'calculated',
        calculatedAt: new Date(
          Math.min(
            ...mobilisationRows.map(({ createdAt }) => Date.parse(createdAt))
          )
        ),
        ficheIds: citedFicheIds.toSorted((a, b) => a - b),
      });
    } catch (error) {
      this.logger.error(
        `Could not read mobilisation state of collectivite ${collectiviteId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(VoletErrorEnum.GET_MOBILISATION_STATE_ERROR);
    }
  }

  async updateMobilisation({
    collectiviteId,
    leviers,
    tx,
  }: {
    collectiviteId: number;
    leviers: LevierMobilisation[];
    tx?: Transaction;
  }): Promise<Result<void, VoletError>> {
    const runner = tx ?? this.db;

    const rows = toCollectiviteVoletGesRows({ collectiviteId, leviers });

    try {
      await runner
        .delete(collectiviteVoletGesTable)
        .where(eq(collectiviteVoletGesTable.collectiviteId, collectiviteId));

      if (rows.length > 0) {
        await runner.insert(collectiviteVoletGesTable).values(rows);
      }

      return success(undefined);
    } catch (error) {
      this.logger.error(
        `Could not write mobilisation of collectivite ${collectiviteId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(VoletErrorEnum.SAVE_VOLETS_ERROR);
    }
  }

  async getMobilisation(
    collectiviteId: number
  ): Promise<Result<LevierMobilisation[], VoletError>> {
    try {
      const rows = await this.db
        .select({
          levierId: collectiviteVoletGesTable.levierId,
          categorie: collectiviteVoletGesTable.categorie,
          note: collectiviteVoletGesTable.note,
          ficheIds: collectiviteVoletGesTable.ficheIds,
        })
        .from(collectiviteVoletGesTable)
        .where(eq(collectiviteVoletGesTable.collectiviteId, collectiviteId));

      const byLevier = rows.reduce<Map<LevierId, VoletMobilisation[]>>(
        (acc, { levierId, categorie, note, ficheIds }) =>
          acc.set(levierId, [
            ...(acc.get(levierId) ?? []),
            { categorie, note, ficheIds },
          ]),
        new Map()
      );

      return success(
        [...byLevier.entries()].map(([levierId, volets]) => ({
          levierId,
          volets,
        }))
      );
    } catch (error) {
      this.logger.error(
        `Could not read mobilisation of collectivite ${collectiviteId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(VoletErrorEnum.GET_VOLETS_ERROR);
    }
  }
}
