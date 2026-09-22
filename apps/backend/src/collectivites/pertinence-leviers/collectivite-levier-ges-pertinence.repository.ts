import { Injectable, Logger } from '@nestjs/common';
import { SQL_CURRENT_TIMESTAMP } from '@tet/backend/utils/column.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { PertinenceLevier } from '@tet/domain/collectivites';
import { getErrorMessage } from '@tet/domain/utils';
import { eq } from 'drizzle-orm';
import { collectiviteLevierGesPertinenceTable } from './models/collectivite-levier-ges-pertinence.table';
import {
  PertinenceLeviersRepositoryErrorEnum,
  type PertinenceLeviersRepositoryError,
} from './pertinence-leviers.errors';
import {
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

  async upsert({
    collectiviteId,
    levierId,
    categorie,
    pertinence,
    modifiedBy,
  }: UpsertPertinenceInput): Promise<
    Result<void, PertinenceLeviersRepositoryError>
  > {
    try {
      await this.db
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
