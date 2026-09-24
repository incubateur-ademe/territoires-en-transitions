import { Injectable, Logger } from '@nestjs/common';
import { SQL_CURRENT_TIMESTAMP } from '@tet/backend/utils/column.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { Pertinence, PertinenceLevier } from '@tet/domain/collectivites';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { collectiviteLevierGesPertinenceTable } from './models/collectivite-levier-ges-pertinence.table';
import {
  PertinenceLeviersRepositoryErrorEnum,
  type PertinenceLeviersRepositoryError,
} from './pertinence-leviers.errors';
import {
  LevierPertinenceTarget,
  PertinenceLeviersRepository,
  UpsertPertinenceInput,
} from './pertinence-leviers.repository';

type StoredPertinenceLevier = Pick<
  typeof collectiviteLevierGesPertinenceTable.$inferSelect,
  'levierId' | 'categorie' | 'pertinence'
>;

const toPertinenceLevier = ({
  levierId,
  categorie,
  pertinence,
}: StoredPertinenceLevier): PertinenceLevier => {
  if (categorie === null) {
    return { levierId, pertinence };
  }
  return { levierId, categorie, pertinence };
};

@Injectable()
export class CollectiviteLevierGesPertinenceRepository
  implements PertinenceLeviersRepository
{
  private readonly db = this.database.db;
  private readonly logger = new Logger(
    CollectiviteLevierGesPertinenceRepository.name
  );

  constructor(private readonly database: DatabaseService) {}

  async list(
    collectiviteId: number
  ): Promise<Result<PertinenceLevier[], PertinenceLeviersRepositoryError>> {
    try {
      const storedPertinences = await this.db
        .select({
          levierId: collectiviteLevierGesPertinenceTable.levierId,
          categorie: collectiviteLevierGesPertinenceTable.categorie,
          pertinence: collectiviteLevierGesPertinenceTable.pertinence,
        })
        .from(collectiviteLevierGesPertinenceTable)
        .where(
          eq(
            collectiviteLevierGesPertinenceTable.collectiviteId,
            collectiviteId
          )
        );

      return success(storedPertinences.map(toPertinenceLevier));
    } catch (error) {
      this.logger.error(
        `Could not list pertinences of collectivite ${collectiviteId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(
        PertinenceLeviersRepositoryErrorEnum.LIST_PERTINENCES_ERROR
      );
    }
  }

  async getLevierPertinence({
    collectiviteId,
    levierId,
    tx,
  }: LevierPertinenceTarget): Promise<
    Result<Pertinence | undefined, PertinenceLeviersRepositoryError>
  > {
    const runner = tx ?? this.db;

    try {
      const [storedLevierPertinence] = await runner
        .select({ pertinence: collectiviteLevierGesPertinenceTable.pertinence })
        .from(collectiviteLevierGesPertinenceTable)
        .where(
          and(
            eq(
              collectiviteLevierGesPertinenceTable.collectiviteId,
              collectiviteId
            ),
            eq(collectiviteLevierGesPertinenceTable.levierId, levierId),
            isNull(collectiviteLevierGesPertinenceTable.categorie)
          )
        )
        .limit(1);

      return success(storedLevierPertinence?.pertinence);
    } catch (error) {
      this.logger.error(
        `Could not read pertinence of levier ${levierId} for collectivite ${collectiviteId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(
        PertinenceLeviersRepositoryErrorEnum.GET_LEVIER_PERTINENCE_ERROR
      );
    }
  }

  async deleteCategoriePertinences({
    collectiviteId,
    levierId,
    tx,
  }: LevierPertinenceTarget): Promise<
    Result<void, PertinenceLeviersRepositoryError>
  > {
    const runner = tx ?? this.db;

    try {
      await runner
        .delete(collectiviteLevierGesPertinenceTable)
        .where(
          and(
            eq(
              collectiviteLevierGesPertinenceTable.collectiviteId,
              collectiviteId
            ),
            eq(collectiviteLevierGesPertinenceTable.levierId, levierId),
            isNotNull(collectiviteLevierGesPertinenceTable.categorie)
          )
        );

      return success(undefined);
    } catch (error) {
      this.logger.error(
        `Could not delete categorie pertinences of levier ${levierId} for collectivite ${collectiviteId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(
        PertinenceLeviersRepositoryErrorEnum.DELETE_CATEGORIE_PERTINENCES_ERROR
      );
    }
  }

  async upsert({
    collectiviteId,
    levierId,
    categorie,
    pertinence,
    modifiedBy,
    tx,
  }: UpsertPertinenceInput): Promise<
    Result<void, PertinenceLeviersRepositoryError>
  > {
    const runner = tx ?? this.db;

    try {
      await runner
        .insert(collectiviteLevierGesPertinenceTable)
        .values({
          collectiviteId,
          levierId,
          categorie: categorie ?? null,
          pertinence,
          modifiedBy,
        })
        .onConflictDoUpdate({
          target: [
            collectiviteLevierGesPertinenceTable.collectiviteId,
            collectiviteLevierGesPertinenceTable.levierId,
            collectiviteLevierGesPertinenceTable.categorie,
          ],
          set: { pertinence, modifiedBy, modifiedAt: SQL_CURRENT_TIMESTAMP },
        });

      return success(undefined);
    } catch (error) {
      this.logger.error(
        `Could not upsert pertinence of levier ${levierId} (categorie ${
          categorie ?? 'none'
        }) for collectivite ${collectiviteId}: ${getErrorMessage(error)}`
      );
      return failure(
        PertinenceLeviersRepositoryErrorEnum.UPSERT_PERTINENCE_ERROR
      );
    }
  }
}
